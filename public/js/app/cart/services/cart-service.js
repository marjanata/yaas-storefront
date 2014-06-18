/*
 * [y] hybris Platform
 *
 * Copyright (c) 2000-2014 hybris AG
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of hybris
 * ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with hybris.
 */

'use strict';

angular.module('ds.cart')
    .factory('CartSvc', ['$rootScope', 'caas', function($rootScope, caas){

        // Matches CAAS schema
        var CartItem = function(productId, qty) {
            this.productId = productId;
            this.quantity = qty;
        };

        // Matches CAAS schema
        var CaasUpdateCart = function() {
            this.cartItems = [];
        };

        var Cart = function(){
           this.estTax = 0;
           this.cartItems = [];
           this.totalUnitsCount = 0;
           this.subTotalPrice = {};
           this.subTotalPrice.price = 0;
           this.totalPrice = {};
           this.totalPrice.price = 0;
           this.id = null;
        };

        var cart = new Cart();

        function createCartItem(item) {

            var newCart = {};
            if(cart.id){
                newCart.cartId = cart.id;
            }

            newCart.cartItem = item;

            caas.cartItems.API.save(newCart).$promise.then(function(response){
                cart.id = response.cartId;
                refreshCart();
            });
        }

        function updateCart(){
            var newCart = new CaasUpdateCart();
            newCart.cartId = cart.id;
            angular.forEach(cart.items, function(item){
                newCart.cartItems.push(new CartItem(item.productId, item.quantity));
            });

            caas.cart.API.update({cartId: cart.id }, newCart).$promise.then(function(response){
                console.log(response);
                refreshCart();
            });
        }

        function refreshCart(){
            var newCart = caas.cartDetails.API.get({cartId: cart.id });
            newCart.$promise.then(function(response){
                cart.subTotalPrice = response.subTotalPrice;
                cart.totalUnitsCount = response.totalUnitsCount;
                cart.totalPrice = response.totalPrice;
                cart.cartItems = response.cartItems;
                $rootScope.$emit('cart:updated', cart);
            });
        }

        return {

            getCart: function() {
                return cart;
            },



            /**
             *
             * @param productId
             * @param qty
             * @param keepZeroInCart  if true, a line item with qty undefined or zero will be kept in the cart;
             *                      otherwise, it will be removed
             */
            updateLineItem: function(productId, qty, keepZeroInCart) {
                for (var i = 0; i < cart.items.length; i++) {
                    if (cart.items[i].productId === productId) {
                       cart.items[i].quantity = qty;
                       break;
                    }
                }
                updateCart();
                //recalculateCart(keepZeroInCart);
            },

            /*
                converts product object to line item object and pushes it to the cart
             */
            addProductToCart: function (product, productDetailQty) {
                var alreadyInCart = false;
                for (var i = 0; i < cart.cartItems.length; i++) {
                    if (product.id === cart.cartItems[i].productId) {
                        cart.cartItems[i].quantity = cart.cartItems[i].quantity + productDetailQty;
                        alreadyInCart = true;
                        break;
                    }
                }
                if(alreadyInCart) {
                    updateCart();
                }  else if (productDetailQty > 0 ) {
                    createCartItem(new CartItem(product.id, productDetailQty));
                }
            },

            /*
                removes a product from the cart
             */
            removeProductFromCart: function (productId) {
                angular.forEach(cart.items, function (cartItem) {
                   if(cartItem.productId === productId) {
                       cartItem.quantity = 0;
                   }
                });
                updateCart();
            }

        };

    }]);
