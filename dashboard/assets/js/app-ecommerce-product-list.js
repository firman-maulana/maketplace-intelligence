/**
 * Marketplace Intelligence - Product List with Multi-dimensional Filters
 * Category, Price Range, Location, Search, and Live Sync
 */

document.addEventListener("DOMContentLoaded", function () {
  const tableEl = document.querySelector(".datatables-products");
  if (!tableEl) return;

  const statusMap = {
    1: { title: "Data Lama", class: "bg-label-warning" },
    2: { title: "Aktif", class: "bg-label-success" },
    3: { title: "Stok Habis", class: "bg-label-danger" }
  };

  const categoryIcons = {
    "Elektronik": '<span class="w-px-30 h-px-30 rounded-circle d-flex justify-content-center align-items-center bg-label-danger me-2"><i class="icon-base ti tabler-device-mobile icon-18px"></i></span>',
    "Fashion": '<span class="w-px-30 h-px-30 rounded-circle d-flex justify-content-center align-items-center bg-label-warning me-2"><i class="icon-base ti tabler-shirt icon-18px"></i></span>',
    "Rumah Tangga": '<span class="w-px-30 h-px-30 rounded-circle d-flex justify-content-center align-items-center bg-label-success me-2"><i class="icon-base ti tabler-home-2 icon-18px"></i></span>',
    "Perlengkapan Rumah": '<span class="w-px-30 h-px-30 rounded-circle d-flex justify-content-center align-items-center bg-label-success me-2"><i class="icon-base ti tabler-home-2 icon-18px"></i></span>'
  };

  // Initialize DataTable
  const dtInstance = new DataTable(tableEl, {
    ajax: {
      url: "http://localhost:8080/api/products",
      headers: {
        "Authorization": "Bearer " + (localStorage.getItem("auth_token") || "")
      },
      data: function (d) {
        const cat = document.getElementById("filterCategory")?.value || "";
        const loc = document.getElementById("filterLocation")?.value || "";
        const stk = document.getElementById("filterStock")?.value || "";
        const priceRange = document.getElementById("filterPrice")?.value || "";

        const u = JSON.parse(localStorage.getItem("auth_user") || "{}");
        if (u.id) d.user_id = u.id;
        if (u.role) d.role = u.role;

        if (cat) d.category = cat;
        if (loc) d.location = loc;
        if (stk) d.stock_status = stk;
        if (priceRange) {
          const parts = priceRange.split("-");
          if (parts[0]) d.min_price = parts[0];
          if (parts[1]) d.max_price = parts[1];
        }
      },
      dataSrc: function (json) {
        return json.data || [];
      }
    },
    columns: [
      { data: "id" },
      { data: "id" },
      { data: "product_name" },
      { data: "category" },
      { data: "stock" },
      { data: "price" },
      { data: "qty" },
      { data: "status" },
      { data: "id" }
    ],
    columnDefs: [
      {
        className: "control",
        searchable: false,
        orderable: false,
        responsivePriority: 2,
        targets: 0,
        render: function () { return ""; }
      },
      {
        targets: 1,
        orderable: false,
        searchable: false,
        responsivePriority: 3,
        render: function () {
          return '<input type="checkbox" class="dt-checkboxes form-check-input">';
        }
      },
      {
        // Product Name & Shop Info (Marketplace badge removed per requirement)
        targets: 2,
        responsivePriority: 1,
        render: function (data, type, row) {
          const name = row.product_name || "Produk Marketplace";
          const brand = row.product_brand || (row.shop ? row.shop.name : "Toko Official");
          const img = row.image || "../assets/img/ecommerce-images/amazon-echo.png";
          const location = (row.shop && row.shop.location) ? row.shop.location : "Indonesia";

          return `
            <div class="d-flex justify-content-start align-items-center product-name py-1">
              <div class="avatar-wrapper me-3">
                <div class="avatar rounded-2 bg-label-secondary">
                  <img src="${img}" alt="${name}" class="rounded" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='../assets/img/ecommerce-images/amazon-echo.png'">
                </div>
              </div>
              <div class="d-flex flex-column" style="max-width: 340px;">
                <h6 class="text-truncate mb-1">
                  <a href="app-ecommerce-product-detail.html?id=${row.id}" class="text-heading text-primary-hover fw-medium" title="${name}">
                    ${name}
                  </a>
                </h6>
                <small class="text-muted text-truncate">${brand} &bull; <i class="icon-base ti tabler-map-pin"></i> ${location}</small>
              </div>
            </div>
          `;
        }
      },
      {
        // Category
        targets: 3,
        responsivePriority: 5,
        render: function (data, type, row) {
          const cat = row.category || "Fashion";
          const icon = categoryIcons[cat] || categoryIcons["Fashion"];
          return `
            <span class="d-flex align-items-center text-heading text-nowrap">
              ${icon}${cat}
            </span>
          `;
        }
      },
      {
        // Stock (Without badge, plain text per requirement)
        targets: 4,
        orderable: true,
        responsivePriority: 3,
        render: function (data, type, row) {
          const stk = Number(row.stock) || 0;
          if (stk <= 0) {
            return '<span class="text-danger fw-semibold">Habis</span>';
          }
          return `<span class="text-heading fw-medium">${stk.toLocaleString("id-ID")} unit</span>`;
        }
      },
      {
        // Price
        targets: 5,
        orderable: true,
        render: function (data, type, row) {
          const p = Number(row.price) || 0;
          return `<strong class="text-heading text-nowrap">Rp ${p.toLocaleString("id-ID")}</strong>`;
        }
      },
      {
        // Est. Daily Sales & Total Sold
        targets: 6,
        orderable: true,
        responsivePriority: 4,
        render: function (data, type, row) {
          const daily = Number(row.qty || row.quantity || 0);
          const total = Number(row.total_sold || 0);
          return `
            <div>
              <span class="text-primary fw-bold text-nowrap">+${daily.toLocaleString("id-ID")}/hari</span>
              <small class="text-muted d-block font-11">${total.toLocaleString("id-ID")} total terjual</small>
            </div>
          `;
        }
      },
      {
        // Status Data
        targets: 7,
        render: function (data, type, row) {
          const st = statusMap[row.status] || { class: "bg-label-success", title: "Aktif" };
          return `<span class="badge ${st.class}">${st.title}</span>`;
        }
      },
      {
        // Actions
        targets: 8,
        title: "Aksi",
        searchable: false,
        orderable: false,
        render: function (data, type, row) {
          return `
            <div class="d-flex align-items-center gap-1">
              <a href="app-ecommerce-product-detail.html?id=${row.id}" class="btn btn-sm btn-icon btn-label-primary waves-effect" title="Lihat Detail Intelijen">
                <i class="icon-base ti tabler-eye icon-18px"></i>
              </a>
              <a href="${row.url || '#'}" target="_blank" class="btn btn-sm btn-icon btn-label-secondary waves-effect" title="Buka di Marketplace Asli">
                <i class="icon-base ti tabler-external-link icon-18px"></i>
              </a>
            </div>
          `;
        }
      }
    ],
    order: [[6, "desc"]], // Sort by daily sales / total sold descending (terlaris pertama)
    displayLength: 10,
    dom: '<"card-header d-flex border-top rounded-0 flex-wrap py-3 flex-column flex-md-row align-items-md-center justify-content-between"<"me-md-5 my-1"f><"d-flex align-items-center gap-3 my-1"l>>t<"row mx-3 my-3 align-items-center"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6 d-flex justify-content-md-end justify-content-center"p>>',
    language: {
      search: "",
      searchPlaceholder: "Cari produk / toko / brand...",
      lengthMenu: "_MENU_ per halaman",
      info: "Menampilkan _START_ - _END_ dari _TOTAL_ produk terlaris",
      infoEmpty: "Tidak ada produk yang cocok",
      emptyTable: "Belum ada produk yang ditemukan. Silakan gunakan fitur 'Pencarian & Live Scraping' di atas untuk mengambil data produk terlaris.",
      paginate: {
        next: '<i class="icon-base ti tabler-chevron-right icon-18px"></i>',
        previous: '<i class="icon-base ti tabler-chevron-left icon-18px"></i>'
      }
    },
    initComplete: function () {
      const searchInput = document.querySelector(".dataTables_filter input");
      if (searchInput) {
        searchInput.classList.add("form-control");
        searchInput.style.minWidth = "260px";
      }
      const lengthSelect = document.querySelector(".dataTables_length select");
      if (lengthSelect) {
        lengthSelect.classList.add("form-select");
      }
    }
  });

  // Attach Filter Change Listeners
  const filterInputs = ["filterCategory", "filterPrice", "filterLocation", "filterStock"];
  filterInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", function () {
        dtInstance.ajax.reload();
      });
    }
  });

  // Reset Filters Button
  const resetBtn = document.getElementById("btnResetFilters");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      filterInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      dtInstance.search("").draw();
      dtInstance.ajax.reload();
    });
  }

  // Update Top Widget Stats (Per-User Scope)
  function updateListStats() {
    const u = JSON.parse(localStorage.getItem("auth_user") || "{}");
    const token = localStorage.getItem("auth_token") || "";
    const url = u.id ? `http://localhost:8080/api/analytics/summary?user_id=${u.id}&role=${u.role || 'user'}` : "http://localhost:8080/api/analytics/summary";

    fetch(url, {
      headers: {
        "Authorization": "Bearer " + token
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!data) return;
        const totalProdEl = document.getElementById("listTotalProducts");
        const dailySoldEl = document.getElementById("listDailySold");
        const totalShopsEl = document.getElementById("listTotalShops");
        const catCountEl = document.getElementById("listCategoryCount");
        const catBadgeEl = document.getElementById("listCategoryBadge");

        if (totalProdEl) {
          totalProdEl.textContent = (data.total_products || 0).toLocaleString("id-ID") + " Item";
        }
        if (dailySoldEl) {
          dailySoldEl.textContent = (data.daily_sold_sum || 0).toLocaleString("id-ID") + " Unit/Hari";
        }
        if (totalShopsEl) {
          totalShopsEl.textContent = (data.total_shops || 0).toLocaleString("id-ID") + " Toko";
        }
        const cats = (data.category_counts && typeof data.category_counts === "object") ? Object.keys(data.category_counts) : [];
        if (catCountEl) {
          catCountEl.textContent = cats.length + " Kategori";
        }
        if (catBadgeEl) {
          catBadgeEl.textContent = cats.length > 0 ? cats.join(", ") : "-";
        }
      })
      .catch(err => console.warn("List summary fetch note:", err));
  }

  // Live On-Demand Scraping Trigger (Keyword & Category)
  const btnLiveCrawl = document.getElementById("btnLiveCrawl");
  const btnLiveCrawlText = document.getElementById("btnLiveCrawlText");
  const targetKeywordInput = document.getElementById("targetKeyword");
  const targetCategorySelect = document.getElementById("targetCategory");
  const liveCrawlStatus = document.getElementById("liveCrawlStatus");
  const liveCrawlStatusMsg = document.getElementById("liveCrawlStatusMsg");

  function triggerLiveCrawl() {
    const kw = (targetKeywordInput?.value || "").trim();
    const cat = targetCategorySelect?.value || "Fashion";

    if (!kw) {
      if (targetKeywordInput) {
        targetKeywordInput.focus();
        targetKeywordInput.classList.add("is-invalid");
        setTimeout(() => targetKeywordInput.classList.remove("is-invalid"), 2500);
      }
      return;
    }

    // Set Loading UI
    if (btnLiveCrawl) btnLiveCrawl.disabled = true;
    if (btnLiveCrawlText) {
      btnLiveCrawlText.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Scraping Live...';
    }
    if (liveCrawlStatus) {
      liveCrawlStatus.className = "alert alert-primary d-flex align-items-center mt-3 mb-0 py-2 px-3";
      liveCrawlStatus.classList.remove("d-none");
    }
    if (liveCrawlStatusMsg) {
      liveCrawlStatusMsg.innerHTML = `<strong>Menjalankan Apify Crawler...</strong> Mengambil produk terlaris untuk kata kunci: <em>"${kw}"</em> pada kategori <strong>${cat}</strong> secara live dari marketplace.`;
    }

    const activeUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const activeToken = localStorage.getItem('auth_token') || '';

    fetch("http://localhost:8080/api/scrape/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + activeToken
      },
      body: JSON.stringify({
        keyword: kw,
        category: cat,
        limit: 25,
        platforms: ["tokopedia", "shopee"],
        user_id: activeUser.id || 0,
        username: activeUser.username || activeUser.name || "User",
        role: activeUser.role || "user"
      })
    })
      .then(res => res.json())
      .then(data => {
        if (btnLiveCrawl) btnLiveCrawl.disabled = false;
        if (btnLiveCrawlText) {
          btnLiveCrawlText.textContent = "Cari & Scrape Live";
        }

        if (liveCrawlStatus && liveCrawlStatusMsg) {
          liveCrawlStatus.className = "alert alert-success d-flex align-items-center mt-3 mb-0 py-2 px-3";
          liveCrawlStatusMsg.innerHTML = `<i class="icon-base ti tabler-check me-2 text-success"></i><strong>Scraping Selesai!</strong> ${data.total_scraped || 0} produk live baru untuk "${kw}" berhasil disinkronkan ke tabel.`;
          setTimeout(() => {
            liveCrawlStatus.classList.add("d-none");
          }, 8000);
        }

        // Set local category to match newly crawled category if present
        const filterCat = document.getElementById("filterCategory");
        if (filterCat && cat) {
          filterCat.value = cat;
        }

        // Reload table & stats immediately
        dtInstance.ajax.reload();
        updateListStats();
      })
      .catch(err => {
        console.error("Live crawl error:", err);
        if (btnLiveCrawl) btnLiveCrawl.disabled = false;
        if (btnLiveCrawlText) {
          btnLiveCrawlText.textContent = "Cari & Scrape Live";
        }
        if (liveCrawlStatus && liveCrawlStatusMsg) {
          liveCrawlStatus.className = "alert alert-danger d-flex align-items-center mt-3 mb-0 py-2 px-3";
          liveCrawlStatusMsg.innerHTML = `<i class="icon-base ti tabler-alert-triangle me-2 text-danger"></i>Gagal melakukan scraping: ${err.message || "Koneksi terputus"}`;
        }
      });
  }

  if (btnLiveCrawl) {
    btnLiveCrawl.addEventListener("click", triggerLiveCrawl);
  }
  if (targetKeywordInput) {
    targetKeywordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        triggerLiveCrawl();
      }
    });
  }

  updateListStats();

  // Auto sync when user returns to tab
  window.addEventListener("focus", function () {
    if (dtInstance) dtInstance.ajax.reload(null, false);
    updateListStats();
  });

  // Periodically refresh list & stats every 15s to catch scheduled crawler ingestion
  setInterval(function () {
    if (dtInstance) dtInstance.ajax.reload(null, false);
    updateListStats();
  }, 15000);
});