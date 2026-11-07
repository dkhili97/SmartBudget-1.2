package com.smartbudget.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
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
import java.util.List;

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
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed to open install settings", e);
            call.reject("Cannot open install settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        String filename = call.getString("filename", "SmartBudget-update.apk");

        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        // Run download and launch in a dedicated background worker
        new Thread(() -> {
            HttpURLConnection connection = null;
            InputStream in = null;
            FileOutputStream out = null;

            try {
                Context context = getContext();

                // Select the best writable storage directory
                File targetDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (targetDir == null) {
                    targetDir = context.getCacheDir();
                }
                if (!targetDir.exists()) {
                    targetDir.mkdirs();
                }

                File apkFile = new File(targetDir, filename);
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                Log.d(TAG, "Starting APK download from: " + downloadUrl);

                URL currentUrl = new URL(downloadUrl);
                int redirectCount = 0;
                final int MAX_REDIRECTS = 8;

                // Follow all GitHub / AWS S3 redirect hops cleanly
                while (redirectCount < MAX_REDIRECTS) {
                    connection = (HttpURLConnection) currentUrl.openConnection();
                    connection.setInstanceFollowRedirects(false);
                    connection.setRequestProperty("User-Agent", "SmartBudget-Mobile-App/1.6");
                    connection.setRequestProperty("Accept", "*/*");
                    connection.setConnectTimeout(25000);
                    connection.setReadTimeout(35000);
                    connection.connect();

                    int responseCode = connection.getResponseCode();
                    Log.d(TAG, "HTTP " + responseCode + " for: " + currentUrl.toString());

                    if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
                        responseCode == HttpURLConnection.HTTP_MOVED_PERM ||
                        responseCode == HttpURLConnection.HTTP_SEE_OTHER ||
                        responseCode == 307 || responseCode == 308) {
                        
                        String newLocation = connection.getHeaderField("Location");
                        connection.disconnect();

                        if (newLocation == null || newLocation.isEmpty()) {
                            throw new Exception("Redirect without Location header");
                        }

                        // Resolve relative redirect URL if needed
                        currentUrl = new URL(currentUrl, newLocation);
                        redirectCount++;
                    } else if (responseCode == HttpURLConnection.HTTP_OK) {
                        break;
                    } else {
                        throw new Exception("Server returned HTTP " + responseCode + " " + connection.getResponseMessage());
                    }
                }

                in = connection.getInputStream();
                out = new FileOutputStream(apkFile);

                byte[] buffer = new byte[16384];
                int bytesRead;
                long totalBytes = 0;

                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                    totalBytes += bytesRead;
                }

                out.flush();
                out.close();
                out = null;
                in.close();
                in = null;
                connection.disconnect();
                connection = null;

                Log.d(TAG, "Download finished successfully. File size: " + totalBytes + " bytes");

                if (!apkFile.exists() || apkFile.length() < 10000) {
                    throw new Exception("Downloaded file is invalid or too small (" + apkFile.length() + " bytes)");
                }

                apkFile.setReadable(true, false);

                // Build FileProvider Uri
                Uri apkUri = FileProvider.getUriForFile(
                        context,
                        context.getPackageName() + ".fileprovider",
                        apkFile
                );

                Log.d(TAG, "Launching Package Installer with URI: " + apkUri.toString());

                // Launch Package Installer Intent
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

                // Explicitly grant read URI permissions to all matching installer packages
                List<ResolveInfo> resolveInfoList = context.getPackageManager().queryIntentActivities(installIntent, PackageManager.MATCH_DEFAULT_ONLY);
                for (ResolveInfo resolveInfo : resolveInfoList) {
                    if (resolveInfo.activityInfo != null && resolveInfo.activityInfo.packageName != null) {
                        context.grantUriPermission(resolveInfo.activityInfo.packageName, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    }
                }

                context.startActivity(installIntent);

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("message", "Package installer started");
                call.resolve(res);

            } catch (Exception e) {
                Log.e(TAG, "Error downloading or installing APK", e);

                // Emergency fallback: Trigger Android DownloadManager
                try {
                    Context context = getContext();
                    DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                    if (downloadManager != null) {
                        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
                        request.setTitle("Mise à jour SmartBudget");
                        request.setDescription("Téléchargement du nouvel APK...");
                        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "SmartBudget-update.apk");
                        downloadManager.enqueue(request);

                        JSObject res = new JSObject();
                        res.put("success", true);
                        res.put("message", "Téléchargement confié au gestionnaire de téléchargements Android");
                        call.resolve(res);
                        return;
                    }
                } catch (Exception dmErr) {
                    Log.e(TAG, "DownloadManager fallback failed too", dmErr);
                }

                call.reject("Échec de l'installation : " + e.getMessage(), e);
            } finally {
                try { if (out != null) out.close(); } catch (Exception ignored) {}
                try { if (in != null) in.close(); } catch (Exception ignored) {}
                try { if (connection != null) connection.disconnect(); } catch (Exception ignored) {}
            }
        }).start();
    }
}
