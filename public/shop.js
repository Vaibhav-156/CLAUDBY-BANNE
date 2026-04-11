(function () {
    var productGrid = document.getElementById('productGrid');
    var shopLoading = document.getElementById('shopLoading');
    var summaryCount = document.getElementById('summaryCount');
    var summaryTotal = document.getElementById('summaryTotal');
    var headerCartCount = document.getElementById('headerCartCount');
    var toast = document.getElementById('shopToast');

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        window.setTimeout(function () {
            toast.classList.remove('show');
        }, 1400);
    }

    function renderProducts() {
        var cards = window.PREMADE_PRODUCTS.map(function (product) {
            return [
                '<article class="product-card">',
                '<img class="product-image" src="' + product.image + '" alt="' + product.name + '" loading="lazy" />',
                '<div class="product-info">',
                '<h3 class="product-name">' + product.name + '</h3>',
                '<p class="product-price">' + window.CartStore.formatCurrency(product.price) + '</p>',
                '<button class="primary-btn add-to-cart" data-product-id="' + product.id + '">Add to Cart</button>',
                '</div>',
                '</article>'
            ].join('');
        }).join('');

        productGrid.innerHTML = cards;
    }

    function updateSummary() {
        var summary = window.CartStore.getSummary();
        summaryCount.textContent = String(summary.totalCount);
        summaryTotal.textContent = window.CartStore.formatCurrency(summary.totalPrice);
        headerCartCount.textContent = String(summary.totalCount);
    }

    function findProduct(productId) {
        return window.PREMADE_PRODUCTS.find(function (item) {
            return item.id === productId;
        });
    }

    productGrid.addEventListener('click', function (event) {
        var target = event.target;
        if (!target.classList.contains('add-to-cart')) {
            return;
        }

        var productId = target.getAttribute('data-product-id');
        var product = findProduct(productId);

        if (!product) {
            return;
        }

        window.CartStore.addItem(product, 1);
        updateSummary();
        showToast(product.name + ' added to cart');
    });

    window.addEventListener('cart:updated', updateSummary);

    window.setTimeout(function () {
        renderProducts();
        shopLoading.style.display = 'none';
        updateSummary();
    }, 220);
})();
