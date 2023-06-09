import {settings, select, classNames, templates} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

const app = {
  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);

    const idFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages){
      if(page.id == idFromHash){
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);

    for (let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();

        const pageId = clickedElement.getAttribute('href').substring(1);
        thisApp.activatePage(pageId);

        window.location.hash = '#/' + pageId;
      })
    }
  },

  activatePage: function(pageId){
    const thisApp = this;

    for (const page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    for (const link of thisApp.navLinks){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },

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

  initBooking: function(){
    const thisApp = this;

    const bookingElem = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking(bookingElem);
  },

  init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initPages();
      thisApp.initData();
      thisApp.initCart();
      thisApp.initBooking();
  },
};

app.init();