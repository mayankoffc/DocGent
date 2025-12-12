
'use client';

import { storage } from '@/lib/firebase';
import { ref, uploadBytes, listAll, getDownloadURL, getMetadata } from 'firebase/storage';

if (!storage) {
    console.warn("Firebase Storage is not configured. Cloud storage features will be disabled.");
}

export interface DocumentFile {
    name: string;
    url: string;
    createdAt: number;
}

export async function uploadDocument(uid: string, fileName: string, file: Blob): Promise<string> {
    if (!storage) {
        throw new Error("Firebase Storage is not initialized.");
    }
    const docRef = ref(storage, `documents/${uid}/${fileName}`);
    const snapshot = await uploadBytes(docRef, file);
    return getDownloadURL(snapshot.ref);
}

export async function listDocuments(uid: string): Promise<DocumentFile[]> {
    if (!storage) {
        return [];
    }
    const listRef = ref(storage, `documents/${uid}`);
    const res = await listAll(listRef);

    const files: DocumentFile[] = await Promise.all(
        res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            const metadata = await getMetadata(itemRef);
            return {
                name: itemRef.name,
                url: url,
                createdAt: new Date(metadata.timeCreated).getTime(),
            };
        })
    );

    return files;
}


/**
 * Uploads a file directly to the user's Google Drive.
 * @param accessToken The user's Google OAuth access token.
 * @param fileName The name of the file to be created in Google Drive.
 * @param fileBlob The file content as a Blob.
 * @param mimeType The MIME type of the file (e.g., 'application/pdf').
 * @returns The ID of the newly created file in Google Drive.
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
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: form,
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Drive API Error:', errorData);
        throw new Error(`Failed to upload to Google Drive: ${errorData.error.message}`);
    }

    const responseData = await response.json();
    
    // Step 4: Make the file publicy readable (optional, for sharing links)
    // IMPORTANT: This makes the file accessible to anyone with the link.
    // For private files, skip this step. The file will only be visible to the user.
    await fetch(`https://www.googleapis.com/drive/v3/files/${responseData.id}/permissions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
        })
    });

    // Step 5: Get the webViewLink to share with the user
     const fileDetails = await fetch(`https://www.googleapis.com/drive/v3/files/${responseData.id}?fields=webViewLink`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
    const fileDetailsData = await fileDetails.json();


    return { id: responseData.id, webViewLink: fileDetailsData.webViewLink };
}

