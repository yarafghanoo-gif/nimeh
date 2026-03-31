import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db, auth } from "./firebase-config.js";

export async function loadDiscover() {
  const container = document.getElementById("discover-stack");
  const empty = document.getElementById("discover-empty");

  if (!container) return;

  container.innerHTML = "";

  const user = auth.currentUser;
  if (!user) {
    console.log("⛔ auth not ready");
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "users"));

    let count = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (doc.id === user.uid) return;
      if (!data.photoURL) return;

      count++;

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${data.photoURL}" style="width:100%;height:300px;object-fit:cover;border-radius:12px;" />
        <h2>${data.displayName || "No name"}</h2>
        <p>${data.age || ""}</p>
      `;

      container.appendChild(card);
    });

    if (count === 0) {
      empty?.classList.remove("hidden");
    } else {
      empty?.classList.add("hidden");
    }

  } catch (err) {
    console.error("🔥 Firestore error:", err);
  }
}
