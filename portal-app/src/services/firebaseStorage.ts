import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

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
 * Upload a profile photo for a member.
 */
export async function uploadProfilePhoto(file: File, memberId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `profiles/${memberId}/photo.${ext}`;
    return uploadFile(file, path);
}

/**
 * Upload a gallery photo for a member.
 */
export async function uploadGalleryPhoto(file: File, memberId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const path = `gallery/${memberId}/${timestamp}.${ext}`;
    return uploadFile(file, path);
}

/**
 * Upload media (image/video) for a feed post.
 */
export async function uploadPostMedia(file: File, memberId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const path = `posts/${memberId}/${timestamp}.${ext}`;
    return uploadFile(file, path);
}

/**
 * Upload a matrimony profile photo or form scan.
 */
export async function uploadMatrimonyFile(file: File, memberId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const path = `matrimony/${memberId}/${timestamp}.${ext}`;
    return uploadFile(file, path);
}

/**
 * Upload a leader photo (used by admin app).
 */
export async function uploadLeaderPhoto(file: File, leaderId: string): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `leaders/${leaderId}/photo.${ext}`;
    return uploadFile(file, path);
}

/**
 * Delete a file from Firebase Storage by its download URL.
 */
export async function deleteFileByUrl(url: string): Promise<void> {
    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error) {
        console.warn('Failed to delete file from storage:', error);
    }
}
