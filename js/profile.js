import { db, auth, storage } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

export async function loadProfile() {
  const userRef = doc(db, "users", auth.currentUser.uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
}

export async function updateProfile(data, photoFile = null) {
  const userRef = doc(db, "users", auth.currentUser.uid);
  let photoURL = null;
  if (photoFile) {
    const storageRef = ref(storage, `profilePhotos/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, photoFile);
    photoURL = await getDownloadURL(storageRef);
  }
  const updateData = { ...data };
  if (photoURL) updateData.photoURL = photoURL;
  await updateDoc(userRef, updateData);
  return updateData;
}
