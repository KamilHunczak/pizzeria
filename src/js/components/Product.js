import { templates, select, classNames } from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import utils  from "../functions.js";

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

      // app.cart.add(thisProduct.prepereCartProduct());

      const load = thisProduct.prepereCartProduct();

      const event = new CustomEvent ('add-to-cart', {
        bubbles: true,
        detail: {
          product: load,
        },
      });

      thisProduct.element.dispatchEvent(event);
    }
}

export default Product;