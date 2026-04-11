(function () {
    var STORAGE_KEY = 'clawedup_cart_v1';

    function parseCart(raw) {
        if (!raw) {
            return [];
        }

        try {
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed.filter(function (item) {
                return item && item.id && item.name && Number(item.price) >= 0 && Number(item.quantity) > 0;
            });
        } catch (error) {
            console.error('Failed to parse cart:', error);
            return [];
        }
    }

    function readCart() {
        return parseCart(localStorage.getItem(STORAGE_KEY));
    }

    function writeCart(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: getSummary() }));
    }

    function formatCurrency(amount) {
        var value = Number(amount) || 0;
        return 'INR ' + value.toFixed(2);
    }

    function getSummary() {
        var items = readCart();
        var totalCount = 0;
        var totalPrice = 0;

        items.forEach(function (item) {
            totalCount += Number(item.quantity) || 0;
            totalPrice += (Number(item.price) || 0) * (Number(item.quantity) || 0);
        });

        return {
            items: items,
            totalCount: totalCount,
            totalPrice: totalPrice
        };
    }

    function addItem(product, quantity) {
        var qty = Number(quantity) || 1;
        if (!product || !product.id || qty <= 0) {
            return getSummary();
        }

        var items = readCart();
        var existing = items.find(function (item) {
            return item.id === product.id;
        });

        if (existing) {
            existing.quantity += qty;
        } else {
            items.push({
                id: product.id,
                name: product.name,
                price: Number(product.price) || 0,
                image: product.image || '',
                quantity: qty
            });
        }

        writeCart(items);
        return getSummary();
    }

    function updateQuantity(productId, quantity) {
        var qty = Number(quantity);
        var items = readCart();
        var target = items.find(function (item) {
            return item.id === productId;
        });

        if (!target) {
            return getSummary();
        }

        if (qty <= 0) {
            items = items.filter(function (item) {
                return item.id !== productId;
            });
        } else {
            target.quantity = qty;
        }

        writeCart(items);
        return getSummary();
    }

    function removeItem(productId) {
        var items = readCart().filter(function (item) {
            return item.id !== productId;
        });
        writeCart(items);
        return getSummary();
    }

    function clearCart() {
        writeCart([]);
        return getSummary();
    }

    window.CartStore = {
        getSummary: getSummary,
        addItem: addItem,
        updateQuantity: updateQuantity,
        removeItem: removeItem,
        clearCart: clearCart,
        formatCurrency: formatCurrency
    };
})();
