import {settings, select, classNames, templates} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';

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

      thisApp.productlist = document.querySelector(select.containerOf.menu);
      thisApp.productlist.addEventListener('add-to-cart', function(event){
        console.log(thisApp)
        app.cart.add(event.detail.product);
      })
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