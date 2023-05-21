/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';
  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product{
    constructor(id, data){
      const thisProduct = this;


      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }
    renderInMenu(){
      const thisProduct = this;

      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create element using utilis.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */
      const container = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      container.appendChild(thisProduct.element);
    }
    getElements(){
      const thisProduct = this;

      thisProduct.dom = {};

      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
      thisProduct.dom.amountWidgetElem.input = thisProduct.element.querySelector(select.widgets.amount.input);

    }
    initAccordion(){
        const thisProduct = this;

        /* START: add event listener to clickable trigger on event click */
        thisProduct.dom.accordionTrigger.addEventListener('click', function(event){

          /* prevent default action for event */
          event.preventDefault();

          /* find active product (product that has active class) */
          const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

          for (const activeProduct of activeProducts){

            /* if there is active product and it's not thisProduct.element, remove class active from it */
            (activeProduct != thisProduct.element) ? activeProduct.classList.remove(classNames.menuProduct.wrapperActive) : false;
          }

          /* toggle active class on thisProduct.element */
          thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
        })
    }
    initOrderForm(){
      const thisProduct = this;

      thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart()
    });

    }
    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget (thisProduct.dom.amountWidgetElem);
      thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      })

    }
    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      // console.log('formData', formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];

          // IF option isn't default & selected add option price to product ELSE IF option is default & not selected remove option price from product
          if (!option.default && formData[paramId].includes(optionId)){
            const optionPrice = option.price;
            price += optionPrice;
          } else if (option.default && !formData[paramId].includes(optionId)){
            const optionPrice = option.price;
            price -= optionPrice;
          }

          // find option image for option
          const className = ('.'+paramId+'-'+optionId);
          const optionImage = thisProduct.dom.imageWrapper.querySelector(className);

          // IF option is selected & image for option exist add class '.active' ELSE IF it's not selected & img exist remove class '.active'
          if (formData[paramId].includes(optionId) && optionImage){
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }else if (!formData[paramId].includes(optionId) && optionImage){
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          } else if (!optionImage){
            // console.log('img with class ' + className + 'dosen\'t exist')
          }
        }
      }

      thisProduct.priceSingle = price;

      /*multiply price by amound */
      price *= thisProduct.amountWidget.value;

      // update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
    }
    prepereCartProductParams(){
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      const params = {};

      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        params[paramId] = {
          label: param.label,
          options: {},
        }
        // for every option in this category
        for(let optionId in param.options) {

          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];

          // IF option selected add option to productParamsObj
          if (formData[paramId].includes(optionId)){
            params[paramId].options[optionId] = option.label;
          }
        }
      }

      return params
    }
    prepereCartProduct(){
      const thisProduct = this;

      thisProduct.productSummary = {};
      //name, total price, amoundm, option, product price, product id,

      thisProduct.productSummary.id = thisProduct.id;
      thisProduct.productSummary.name = thisProduct.data.name;
      thisProduct.productSummary.amount = thisProduct.amountWidget.value;
      thisProduct.productSummary.priceSingle = thisProduct.priceSingle;
      thisProduct.productSummary.price = thisProduct.priceSingle * thisProduct.productSummary.amount;
      thisProduct.productSummary.params = thisProduct.prepereCartProductParams();

      return thisProduct.productSummary;
    }
    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepereCartProduct());
    }
  }

  class AmountWidget {
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);

    }
    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);

      /*TO DO Add Validation */
      if (thisWidget.value !== newValue &&
          !isNaN(newValue) &&
          newValue <= settings.amountWidget.defaultMax &&
          newValue >= settings.amountWidget.defaultMin){

        thisWidget.value = newValue;
        thisWidget.announce();
      }

      thisWidget.input.value = thisWidget.value;
    }
    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();

        thisWidget.setValue((--thisWidget.input.value));
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();

        thisWidget.setValue((++thisWidget.input.value));
      });
    }
    announce(){
        const thisWidget = this;

        const event = new CustomEvent('updated', {
          bubbles: true
        });
        thisWidget.element.dispatchEvent(event);
      }
  }

  class Cart {
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
    }
    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = element.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = element.querySelector(select.cart.productList);
      thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
      thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice);
      thisCart.dom.form = element.querySelector(select.cart.form);
      thisCart.dom.phone  = element.querySelector(select.cart.phone);
      thisCart.dom.address  = element.querySelector(select.cart.address);


    }
    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      })

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      } )

      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      })

      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();

        thisCart.sendOrder();
      })
    }
    add(menuProduct){
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();
    }
    update(){
      const thisCart = this;

      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for (let product of thisCart.products){
        thisCart.subtotalPrice += product.price;
        thisCart.totalNumber += product.amount;
      }

      if (thisCart.subtotalPrice > 0){
        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee
      } else {
        thisCart.totalPrice = 0;
        thisCart.deliveryFee = 0;
      }

      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;

      for (const price of thisCart.dom.totalPrice){
        price.innerHTML = this.totalPrice;
      }
    }
    remove(menuProduct){
      const thisCart = this;

      menuProduct.dom.wrapper.remove();

      const indexOfProduct = thisCart.products.indexOf(menuProduct);
      thisCart.products.splice(indexOfProduct, 1);
      thisCart.update();
    }
    sendOrder(){
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;
      const payload ={};
      payload.products = [];

      for (let singleProduct of thisCart.products){
        payload.products.push(singleProduct.getData());
      }

      payload.adress = thisCart.dom.address.value;
      payload.phone = thisCart.dom.phone.value;
      payload.totalPrice = thisCart.totalPrice;
      payload.subtotalPrice = thisCart.subtotalPrice;
      payload.deliveryFee = thisCart.deliveryFee;

      const options = {
        method: 'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      };

      fetch(url, options);
    }
  }

  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }
    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price  = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit  = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove  = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      })
    }
    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove',{
        bubbles:true,
        detail:{
          cartProduct: thisCartProduct,
        },
      })
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    initActions(){
      const thisCartProduct = this;

     thisCartProduct.dom.remove.addEventListener('click', function(event){
      event.preventDefault();

      thisCartProduct.remove();
     })
    }
    getData(){
      const thisCartProduct = this;

      const product = {};
      product.amount = thisCartProduct.amount;
      product.id = thisCartProduct.id;
      product.name = thisCartProduct.name;
      product.params = thisCartProduct.params;
      product.price = thisCartProduct.price;
      product.priceSingle = thisCartProduct.priceSingle;

      return product
    }
  }

  const app = {
    initData: function(){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(rawResponse => rawResponse.json())
        .then(function(parsedResponse){
          console.log('parsed response', parsedResponse);

          thisApp.data.products = parsedResponse;
          thisApp.initMenu();
        });
      console.log('thisApp data', JSON.stringify(thisApp.data))
    },

   initMenu: function(){
      const thisApp = this;

      for(let productData of thisApp.data.products){

        new Product(productData.id, productData);
      }
    },

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      app.initData();
      app.initCart();
    },
  };

  app.init();
}