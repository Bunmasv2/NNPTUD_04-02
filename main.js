// --- CẤU HÌNH API ---
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// --- STATE QUẢN LÝ DỮ LIỆU ---
let allProducts = [];       // Chứa toàn bộ dữ liệu từ API
let filteredProducts = [];  // Chứa dữ liệu sau khi search/sort
let currentPage = 1;
let pageSize = 10;
let sortColumn = null;
let sortDirection = 'asc';  // 'asc' hoặc 'desc'

// --- KHỞI TẠO KHI LOAD TRANG ---
document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    // Sự kiện Search (OnChanged)
    document.getElementById('searchInput').addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Sự kiện thay đổi số lượng hiển thị (Pagination size)
    document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
        renderPagination();
    });

    // Sự kiện Submit Form Tạo mới
    document.getElementById('createForm').addEventListener('submit', handleCreateProduct);

    // Sự kiện Submit Form Edit
    document.getElementById('editForm').addEventListener('submit', handleUpdateProduct);
});

// --- 1. LẤY DỮ LIỆU TỪ API ---
async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts]; // Ban đầu chưa lọc
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        alert('Không thể tải dữ liệu từ API.');
    }
}

// --- 2. RENDER BẢNG DỮ LIỆU ---
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    // Tính toán chỉ mục bắt đầu và kết thúc cho phân trang
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filteredProducts.slice(start, end);

    pageData.forEach(item => {
        // Xử lý ảnh (API này đôi khi trả về chuỗi JSON stringify lỗi, cần clean)
        let imgUrl = 'https://placehold.co/50';
        if (item.images && item.images.length > 0) {
            // Loại bỏ các ký tự lạ như [" "] nếu API trả về sai định dạng
            let cleanUrl = item.images[0].replace(/[\[\]"]/g, '');
            if (cleanUrl.startsWith('http')) imgUrl = cleanUrl;
        }

        const tr = document.createElement('tr');

        // Yêu cầu: Description hiển thị khi di chuột (Tooltip)
        tr.setAttribute('data-bs-toggle', 'tooltip');
        tr.setAttribute('data-bs-placement', 'top');
        tr.setAttribute('title', item.description); // Tooltip nội dung

        tr.innerHTML = `
            <td>${item.id}</td>
            <td class="fw-bold text-primary">${item.title}</td>
            <td>$${item.price}</td>
            <td><span class="badge bg-secondary">${item.category ? item.category.name : 'N/A'}</span></td>
            <td><img src="${imgUrl}" class="product-img" alt="img"></td>
            <td>
                <button class="btn btn-sm btn-info text-white" onclick="openDetailModal(${item.id})">
                    <i class="fas fa-eye"></i> View/Edit
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Khởi tạo lại Bootstrap Tooltip sau khi render HTML mới
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// --- 3. XỬ LÝ PHÂN TRANG ---
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    const paginationEl = document.getElementById('pagination');
    paginationEl.innerHTML = '';

    // Nút Previous
    let prevClass = currentPage === 1 ? 'disabled' : '';
    paginationEl.innerHTML += `
        <li class="page-item ${prevClass}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;

    // Các trang (hiển thị đơn giản, nếu quá nhiều trang có thể thu gọn lại)
    // Để demo gọn gàng, mình chỉ hiển thị trang hiện tại và xung quanh nó
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        let activeClass = currentPage === i ? 'active' : '';
        paginationEl.innerHTML += `
            <li class="page-item ${activeClass}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Nút Next
    let nextClass = currentPage === totalPages || totalPages === 0 ? 'disabled' : '';
    paginationEl.innerHTML += `
        <li class="page-item ${nextClass}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
}

// --- 4. TÌM KIẾM ---
function handleSearch(keyword) {
    const term = keyword.toLowerCase();
    filteredProducts = allProducts.filter(item =>
        item.title.toLowerCase().includes(term)
    );
    currentPage = 1; // Reset về trang 1 khi tìm kiếm
    renderTable();
    renderPagination();
}

// --- 5. SẮP XẾP (TITLE & PRICE) ---
function handleSort(column) {
    if (sortColumn === column) {
        // Đảo chiều nếu click lại cột cũ
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    filteredProducts.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Nếu là chữ thì lowerCase để so sánh chính xác
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

// --- 6. EXPORT CSV ---
function exportToCSV() {
    if (filteredProducts.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Title,Price,Category,Description\n";

    filteredProducts.forEach(item => {
        let title = item.title.replace(/,/g, " ");
        let desc = item.description.replace(/,/g, " ").replace(/\n/g, " ");
        let cat = item.category ? item.category.name : "";

        let row = `${item.id},${title},${item.price},${cat},${desc}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function handleCreateProduct(e) {
    e.preventDefault();

    const newProduct = {
        title: document.getElementById('createTitle').value,
        price: parseInt(document.getElementById('createPrice').value),
        description: document.getElementById('createDesc').value,
        categoryId: parseInt(document.getElementById('createCategoryId').value),
        images: [document.getElementById('createImage').value]
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (res.ok) {
            const createdItem = await res.json();
            alert('Tạo thành công! (ID: ' + createdItem.id + ')');

            createdItem.category = { name: 'New Category' }; // Fake category hiển thị
            allProducts.unshift(createdItem);
            filteredProducts = [...allProducts];

            const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
            modal.hide();
            document.getElementById('createForm').reset();

            renderTable();
            renderPagination();
        } else {
            alert('Lỗi khi tạo sản phẩm');
        }
    } catch (err) {
        console.error(err);
    }
}

function openDetailModal(id) {
    const item = allProducts.find(p => p.id === id);
    if (!item) return;

    document.getElementById('detailId').value = item.id;
    document.getElementById('detailTitle').value = item.title;
    document.getElementById('detailPrice').value = item.price;
    document.getElementById('detailDesc').value = item.description;

    let imgUrl = 'https://placehold.co/300';
    if (item.images && item.images.length > 0) {
        let cleanUrl = item.images[0].replace(/[\[\]"]/g, '');
        if (cleanUrl.startsWith('http')) imgUrl = cleanUrl;
    }

    document.getElementById('detailImage').src = imgUrl;
    document.getElementById('detailImageUrl').value = imgUrl; // ⭐ QUAN TRỌNG

    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

async function handleUpdateProduct(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('detailId').value);
    const currentItem = allProducts.find(p => p.id === id);
    if (!currentItem) {
        alert('Không tìm thấy sản phẩm!');
        return;
    }

    const imageUrlInput = document.getElementById('detailImageUrl').value;

    const updatePayload = {
        title: document.getElementById('detailTitle').value,
        price: parseInt(document.getElementById('detailPrice').value),
        description: document.getElementById('detailDesc').value,

        categoryId: currentItem.category?.id || 1,

        // ⭐ UPDATE IMAGE Ở ĐÂY
        images: imageUrlInput
            ? [imageUrlInput]
            : (currentItem.images?.length ? currentItem.images : ['https://placehold.co/600x400'])
    };

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });

        if (!res.ok) throw new Error('Update API failed');

        const updatedItem = await res.json();

        // --- Update local ---
        const index = allProducts.findIndex(p => p.id === id);
        if (index !== -1) {
            allProducts[index] = {
                ...allProducts[index],
                ...updatedItem
            };
        }

        filteredProducts = filteredProducts.map(p =>
            p.id === id ? { ...p, ...updatedItem } : p
        );

        bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();

        renderTable();
        alert('Update thành công (bao gồm image)');
    } catch (err) {
        console.error(err);
        alert('Lỗi khi update!');
    }
}
