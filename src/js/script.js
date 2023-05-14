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
      console.log(thisProduct);

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

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
      thisProduct.amountWidgetElem.input = thisProduct.element.querySelector(select.widgets.amount.input);

    }
    initAccordion(){
        const thisProduct = this;

        /* START: add event listener to clickable trigger on event click */
        thisProduct.accordionTrigger.addEventListener('click', function(event){

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

      thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    thisProduct.amountWidgetElem.addEventListener('update', function(){
      console.log('działa');
    })
    }
    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget (thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      })

    }
    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
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
          const optionImage = thisProduct.imageWrapper.querySelector(className);

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

      /*multiply price by amound */
      price *= thisProduct.amountWidget.value;

      // update calculated price in the HTML
      thisProduct.priceElem.innerHTML = price;
      console.log(thisProduct);
    }
  }

  class AmountWidget {
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
      console.log('this Amound Widget', thisWidget);
    }
    getElements(element){
      const thisWidget = this;
      console.log(thisWidget);

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

        const event = new Event('updated');
        thisWidget.element.dispatchEvent(event);
      }
  }

  // class Cart {
  //   constructor(element){
  //     const thisCart = this;

  //     thisCart.products = [];

  //     thisCart.getElements(element);

  //     console.log(thisCart);
  //   }
  //   getElements(element){
  //     const thisCart = this;

  //     thisCart.dom.wrapper = element;
  //     thisCart.dom = {};
  //   }
  // }

  // class CartProduct {
  //   constructor(){
  //     const thisCartProduct = this;

  //     console.log(thisCartProduct);
  //   }
  // }

  const app = {
    initMenu: function(){
      const thisApp = this;

      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;

      thisApp.data = dataSource;
    },

    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      app.initData();
      app.initMenu();
    },
  };

  app.init();
}