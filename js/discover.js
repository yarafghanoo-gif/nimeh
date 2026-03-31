import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase-config.js";
import { getCurrentUser } from "./auth.js";

export async function loadDiscover() {
  const container = document.getElementById("discover-stack");
  const empty = document.getElementById("discover-empty");

  container.innerHTML = "";

  const me = getCurrentUser();
  if (!me) return;

  try {
    const snapshot = await getDocs(collection(db, "users"));

    let count = 0;

    snapshot.forEach((doc) => {
      const user = doc.data();

      // خودت رو نشون نده
      if (doc.id === me.uid) return;

      // فقط یوزرهایی که عکس دارن
      if (!user.photoURL) return;

      count++;

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${user.photoURL}" class="card-img" />
        <div class="card-info">
          <h2>${user.displayName || "No name"}</h2>
          <p>${user.age || ""}</p>
        </div>
      `;

      container.appendChild(card);
    });

    if (count === 0) {
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
    }

  } catch (e) {
    console.error(e);
  }
}
