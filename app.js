document.addEventListener("DOMContentLoaded", () => {
  if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  displayItems();
});

document.getElementById("addBtn").addEventListener("click", addItem);

function addItem() {
  const food = document.getElementById("foodName").value.trim();
  const expiry = document.getElementById("expiryDate").value;

  if (!food || !expiry) {
    alert("Please enter both food name and expiry date.");
    return;
  }

  const items = JSON.parse(localStorage.getItem("foods")) || [];
  items.push({ name: food, expiry: expiry });
  localStorage.setItem("foods", JSON.stringify(items));

  document.getElementById("foodName").value = "";
  document.getElementById("expiryDate").value = "";
  displayItems();
}

function displayItems() {
  const items = JSON.parse(localStorage.getItem("foods")) || [];
  const donations = JSON.parse(localStorage.getItem("donations")) || [];
  const used = JSON.parse(localStorage.getItem("used")) || [];

  const tbody = document.getElementById("foodList");
  const donationTbody = document.getElementById("donationList");
  const usedTbody = document.getElementById("usedList");

  tbody.innerHTML = "";
  donationTbody.innerHTML = "";
  usedTbody.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  items.forEach((item, index) => {
    const expiryDate = new Date(item.expiry);
    expiryDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    let statusText = "";

    if (diffDays < 0) {
      statusText = "Food has expired";
    } else if (diffDays === 0) {
      statusText = "Expires today";
      showExpiryAlert(item.name, "today");
    } else {
      statusText = `Will expire in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
      if (diffDays === 1) {
        showExpiryAlert(item.name, "tomorrow");
      }
    }

    let actionButtons = `<button onclick="useItem(${index})">✅ Use</button>`;
    if (diffDays >= 0) {
      actionButtons += `<button onclick="donateItem(${index})">❤️ Donate</button>`;
    }
    actionButtons += `<button onclick="deleteItem(${index})">🗑 Delete</button>`;

    let rowClass = "fresh";
    if (diffDays < 0) rowClass = "expired";
    else if (diffDays <= 3) rowClass = "warning";

    const row = document.createElement("tr");
    row.className = rowClass;
    row.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.expiry)}</td>
      <td>${escapeHtml(statusText)}</td>
      <td>${actionButtons}</td>
    `;
    tbody.appendChild(row);
  });

  donations.forEach((d, index) => {
    const expiryDate = new Date(d.expiry);
    expiryDate.setHours(0, 0, 0, 0);

    let status = d.donated ? "✅ Donated" : "Marked for Donation";
    if (expiryDate < today) status = "⚠️ Expired (remove)";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.expiry)}</td>
      <td>${escapeHtml(status)}</td>
      <td>
        ${!d.donated && expiryDate >= today
          ? `<button onclick="markDonated(${index})">✔️ Mark as Donated</button>`
          : ""}
        <button onclick="deleteDonation(${index})">🗑 Delete</button>
      </td>
    `;
    donationTbody.appendChild(row);
  });

  used.forEach((u, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.expiry)}</td>
      <td>✔️ Consumed</td>
      <td><button onclick="deleteUsed(${index})">🗑 Delete</button></td>
    `;
    usedTbody.appendChild(row);
  });
}

function useItem(index) {
  const items = JSON.parse(localStorage.getItem("foods")) || [];
  const used = JSON.parse(localStorage.getItem("used")) || [];
  const usedItem = items.splice(index, 1)[0];
  used.push(usedItem);
  localStorage.setItem("foods", JSON.stringify(items));
  localStorage.setItem("used", JSON.stringify(used));
  displayItems();
}

function donateItem(index) {
  const items = JSON.parse(localStorage.getItem("foods")) || [];
  const donations = JSON.parse(localStorage.getItem("donations")) || [];
  const donatedItem = items.splice(index, 1)[0];
  donatedItem.donated = false;
  donations.push(donatedItem);
  localStorage.setItem("foods", JSON.stringify(items));
  localStorage.setItem("donations", JSON.stringify(donations));
  displayItems();
}

function deleteItem(index) {
  const items = JSON.parse(localStorage.getItem("foods")) || [];
  items.splice(index, 1);
  localStorage.setItem("foods", JSON.stringify(items));
  displayItems();
}

function markDonated(index) {
  const donations = JSON.parse(localStorage.getItem("donations")) || [];
  donations[index].donated = true;
  localStorage.setItem("donations", JSON.stringify(donations));
  displayItems();
}

function deleteDonation(index) {
  const donations = JSON.parse(localStorage.getItem("donations")) || [];
  donations.splice(index, 1);
  localStorage.setItem("donations", JSON.stringify(donations));
  displayItems();
}

function deleteUsed(index) {
  const used = JSON.parse(localStorage.getItem("used")) || [];
  used.splice(index, 1);
  localStorage.setItem("used", JSON.stringify(used));
  displayItems();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showExpiryAlert(foodName, when) {
  const msg = `${foodName} will expire ${when === "today" ? "today, use it now! ⚠️" : "tomorrow! ⚠️"}`;

  alert(msg);

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(msg);
    } catch {
      console.log("Notification blocked, only alert shown.");
    }
  }
}

function findNearbyCenters() {
  const list = document.getElementById("nearbyCenters");
  list.innerHTML = "⏳ Detecting location...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(() => {
      const centers = [
        { name: "Sunrise Orphanage", distance: "5 km", phone: "+91-9876543210" },
        { name: "Hope Old Age Home", distance: "8 km", phone: "+91-9123456780" },
        { name: "Care Shelter NGO", distance: "12 km", phone: "+91-9988776655" }
      ];

      list.innerHTML = "";
      centers.forEach(c => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${c.name}</strong> – ${c.distance}<br>
          📞 <a href="tel:${c.phone}">${c.phone}</a>
        `;
        li.style.marginBottom = "10px";
        list.appendChild(li);
      });
    }, () => {
      list.innerHTML = "<li>❌ Location access denied.</li>";
    });
  } else {
    list.innerHTML = "<li>❌ Geolocation not supported.</li>";
  }
}
