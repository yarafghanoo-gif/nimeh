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

      // خودت رو نشون نده
      if (doc.id === user.uid) return;

      // فقط اگر عکس داشته باشه
      if (!data.photoURL) return;

      count++;

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${data.photoURL}" class="card-img" />
        <div class="card-info">
          <h2>${data.displayName || "No name"}</h2>
          <p>${data.age || ""}</p>
        </div>
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
