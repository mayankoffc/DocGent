
'use client';

/**
 * Uploads a file directly to the user's Google Drive.
 * @param accessToken The user's Google OAuth access token.
 * @param fileName The name of the file to be created in Google Drive.
 * @param fileBlob The file content as a Blob.
 * @param mimeType The MIME type of the file (e.g., 'application/pdf').
 * @returns The ID and web view link of the newly created file in Google Drive.
 */
export async function uploadToGoogleDrive(
    accessToken: string,
    fileName: string,
    fileBlob: Blob,
    mimeType: string
): Promise<{ id: string; webViewLink: string }> {
    
    // Step 1: Create metadata for the file
    const metadata = {
        name: fileName,
        mimeType: mimeType,
    };

    // Step 2: Use multipart upload for metadata and content
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    // Step 3: Make the API call to Google Drive
    // The fields=id,webViewLink parameter ensures we get the file ID and the direct link back
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: form,
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Drive API Error:', errorData);
        throw new Error(`Failed to upload to Google Drive: ${errorData.error?.message || 'Unknown error'}`);
    }

    const responseData = await response.json();
    
    // The file is created as private by default, which is what we want.
    // The user can share it from their Google Drive if they choose.
    // The webViewLink gives the user a direct link to open the file in their Drive.
    return { id: responseData.id, webViewLink: responseData.webViewLink };
}
