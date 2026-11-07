package com.smartbudget.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {
    private static final String TAG = "ApkInstallerPlugin";

    @PluginMethod
    public void checkInstallPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean canInstall = getContext().getPackageManager().canRequestPackageInstalls();
            ret.put("canInstall", canInstall);
        } else {
            ret.put("canInstall", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        String filename = call.getString("filename", "SmartBudget-update.apk");

        if (downloadUrl == null || downloadUrl.isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        // Run download in background thread
        new Thread(() -> {
            try {
                Context context = getContext();
                File targetDir = context.getExternalCacheDir();
                if (targetDir == null) {
                    targetDir = context.getCacheDir();
                }
                File apkFile = new File(targetDir, filename);
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                Log.d(TAG, "Downloading APK from: " + downloadUrl + " to: " + apkFile.getAbsolutePath());

                URL url = new URL(downloadUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", "SmartBudget-Android");
                connection.connect();

                // Handle HTTP redirects (GitHub releases redirect to AWS S3/assets)
                int status = connection.getResponseCode();
                if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM || status == 307 || status == 308) {
                    String newUrl = connection.getHeaderField("Location");
                    connection.disconnect();
                    url = new URL(newUrl);
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setRequestProperty("User-Agent", "SmartBudget-Android");
                    connection.connect();
                }

                InputStream in = connection.getInputStream();
                FileOutputStream out = new FileOutputStream(apkFile);

                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }

                out.flush();
                out.close();
                in.close();
                connection.disconnect();

                Log.d(TAG, "Download finished. APK size: " + apkFile.length() + " bytes");

                if (!apkFile.exists() || apkFile.length() == 0) {
                    call.reject("Downloaded file is empty or missing");
                    return;
                }

                // Launch Android Package Installer Intent via FileProvider
                Uri apkUri = FileProvider.getUriForFile(
                        context,
                        context.getPackageName() + ".fileprovider",
                        apkFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                context.startActivity(installIntent);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "Package installer started");
                call.resolve(result);

            } catch (Exception e) {
                Log.e(TAG, "Error downloading or installing APK", e);
                call.reject("Installation failed: " + e.getMessage(), e);
            }
        }).start();
    }
}

