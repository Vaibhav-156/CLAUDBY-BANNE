(function () {
    var cartItems = document.getElementById('cartItems');
    var summaryCount = document.getElementById('summaryCount');
    var summarySubtotal = document.getElementById('summarySubtotal');
    var summaryTotal = document.getElementById('summaryTotal');
    var headerCartCount = document.getElementById('headerCartCount');
    var checkoutButton = document.getElementById('checkoutButton');

    function renderEmptyState() {
        cartItems.innerHTML = [
            '<div class="empty-state">',
            '<h2>Your cart is empty</h2>',
            '<p>Add your favorite pre-made sets to begin checkout.</p>',
            '<a href="shop.html" class="checkout-btn" style="display: inline-block; margin-top: 0.85rem; width: auto; padding: 0.65rem 1rem;">Shop Now</a>',
            '</div>'
        ].join('');
    }

    function renderCartItems(items) {
        var html = items.map(function (item) {
            return [
                '<article class="cart-item">',
                '<img class="cart-thumb" src="' + item.image + '" alt="' + item.name + '" loading="lazy" />',
                '<div>',
                '<h3>' + item.name + '</h3>',
                '<p class="cart-price">' + window.CartStore.formatCurrency(item.price) + ' each</p>',
                '<div class="qty-controls">',
                '<button type="button" class="qty-btn" data-action="decrease" data-id="' + item.id + '">-</button>',
                '<span class="qty-value">' + item.quantity + '</span>',
                '<button type="button" class="qty-btn" data-action="increase" data-id="' + item.id + '">+</button>',
                '</div>',
                '</div>',
                '<button type="button" class="remove-btn" data-action="remove" data-id="' + item.id + '">Remove</button>',
                '</article>'
            ].join('');
        }).join('');

        cartItems.innerHTML = html;
    }

    function updateSummary(summary) {
        summaryCount.textContent = String(summary.totalCount);
        summarySubtotal.textContent = window.CartStore.formatCurrency(summary.totalPrice);
        summaryTotal.textContent = window.CartStore.formatCurrency(summary.totalPrice);
        headerCartCount.textContent = String(summary.totalCount);

        if (summary.totalCount === 0) {
            checkoutButton.classList.add('disabled');
            checkoutButton.setAttribute('aria-disabled', 'true');
            checkoutButton.href = 'shop.html';
        } else {
            checkoutButton.classList.remove('disabled');
            checkoutButton.removeAttribute('aria-disabled');
            checkoutButton.href = 'checkout.html';
        }
    }

    function render() {
        var summary = window.CartStore.getSummary();

        if (!summary.items.length) {
            renderEmptyState();
        } else {
            renderCartItems(summary.items);
        }

        updateSummary(summary);
    }

    cartItems.addEventListener('click', function (event) {
        var target = event.target;
        var action = target.getAttribute('data-action');
        var productId = target.getAttribute('data-id');

        if (!action || !productId) {
            return;
        }

        var summary = window.CartStore.getSummary();
        var item = summary.items.find(function (entry) {
            return entry.id === productId;
        });

        if (!item) {
            return;
        }

        if (action === 'increase') {
            window.CartStore.updateQuantity(productId, item.quantity + 1);
        }

        if (action === 'decrease') {
            window.CartStore.updateQuantity(productId, item.quantity - 1);
        }

        if (action === 'remove') {
            window.CartStore.removeItem(productId);
        }

        render();
    });

    window.addEventListener('cart:updated', render);
    render();
})();
