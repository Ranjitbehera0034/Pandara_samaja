import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';

/**
 * Upload a file to Firebase Storage and return the download URL.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
    });
    return getDownloadURL(snapshot.ref);
}

/**
 * Upload a leader photo (admin-specific).
 */
export async function uploadLeaderPhoto(file: File, leaderId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `leaders/${leaderId}/photo.${ext}`;
    return uploadFile(file, path);
}

/**
 * Upload a gallery photo (admin-managed).
 */
export async function uploadGalleryPhoto(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const path = `gallery/admin/${timestamp}.${ext}`;
    return uploadFile(file, path);
}

/**
 * Upload a matrimony candidate photo (admin-managed).
 */
export async function uploadMatrimonyPhoto(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const path = `matrimony/photo/${timestamp}.${ext}`;
    return uploadFile(file, path);
}

/**
 * Delete a file from Firebase Storage by URL.
 */
export async function deleteFileByUrl(url: string): Promise<void> {
    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error) {
        console.warn('Failed to delete file from storage:', error);
    }
}
