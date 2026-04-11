(function () {
    var headerCartCount = document.getElementById('headerCartCount');
    var orderSummaryList = document.getElementById('orderSummaryList');
    var orderTotal = document.getElementById('orderTotal');
    var checkoutForm = document.getElementById('checkoutForm');
    var checkoutError = document.getElementById('checkoutError');
    var placeOrderButton = document.getElementById('placeOrderButton');
    var checkoutSuccess = document.getElementById('checkoutSuccess');

    function isValidPhone(phoneNumber) {
        return /^[0-9]{10,15}$/.test(String(phoneNumber || '').replace(/\s/g, ''));
    }

    function renderOrderSummary() {
        var summary = window.CartStore.getSummary();
        headerCartCount.textContent = String(summary.totalCount);

        if (!summary.items.length) {
            orderSummaryList.innerHTML = [
                '<div class="empty-state" style="padding: 1rem 0;">',
                '<p>Your cart is empty.</p>',
                '<a href="shop.html" class="secondary-btn" style="display: inline-block; margin-top: 0.6rem; width: auto; padding: 0.5rem 0.8rem;">Go to Shop</a>',
                '</div>'
            ].join('');
            orderTotal.textContent = window.CartStore.formatCurrency(0);
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = 'Add items before checkout';
            return summary;
        }

        var html = summary.items.map(function (item) {
            var lineTotal = item.price * item.quantity;
            return [
                '<div class="order-row">',
                '<span>' + item.name + ' x ' + item.quantity + '</span>',
                '<strong>' + window.CartStore.formatCurrency(lineTotal) + '</strong>',
                '</div>'
            ].join('');
        }).join('');

        orderSummaryList.innerHTML = html;
        orderTotal.textContent = window.CartStore.formatCurrency(summary.totalPrice);
        placeOrderButton.disabled = false;
        placeOrderButton.textContent = 'Buy Now';
        return summary;
    }

    function setLoading(loading) {
        placeOrderButton.disabled = loading;
        placeOrderButton.textContent = loading ? 'Placing Order...' : 'Buy Now';
    }

    checkoutForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        checkoutError.textContent = '';
        checkoutSuccess.hidden = true;

        var summary = window.CartStore.getSummary();
        if (!summary.items.length) {
            checkoutError.textContent = 'Your cart is empty. Please add a set first.';
            return;
        }

        var customerName = document.getElementById('customerName').value.trim();
        var customerPhone = document.getElementById('customerPhone').value.trim();
        var customerAddress = document.getElementById('customerAddress').value.trim();

        if (customerName.length < 2) {
            checkoutError.textContent = 'Please enter a valid name.';
            return;
        }

        if (!isValidPhone(customerPhone)) {
            checkoutError.textContent = 'Please enter a valid phone number (10-15 digits).';
            return;
        }

        if (customerAddress.length < 8) {
            checkoutError.textContent = 'Please enter a complete address.';
            return;
        }

        setLoading(true);

        try {
            var response = await fetch('/api/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer: {
                        name: customerName,
                        phone: customerPhone,
                        address: customerAddress
                    },
                    cartItems: summary.items,
                    totalPrice: summary.totalPrice
                })
            });

            var result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Unable to place order right now.');
            }

            window.CartStore.clearCart();
            checkoutForm.reset();
            renderOrderSummary();

            checkoutSuccess.hidden = false;
            checkoutSuccess.innerHTML = [
                '<strong>Order placed successfully.</strong><br />',
                'Order ID: <strong>' + result.orderId + '</strong><br />',
                'We will contact you soon for confirmation.<br />',
                '<a href="shop.html" style="text-decoration: underline;">Shop again</a>'
            ].join('');
        } catch (error) {
            checkoutError.textContent = error.message || 'Failed to place order.';
        } finally {
            setLoading(false);
        }
    });

    document.getElementById('customerPhone').addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    window.addEventListener('cart:updated', renderOrderSummary);
    renderOrderSummary();
})();
