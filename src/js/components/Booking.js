import utils from "../functions.js";
import { select, settings, templates } from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";

class Booking{
    constructor(element){
        const thisBooking = this;

        thisBooking.element = element;
        thisBooking.render();
        thisBooking.initWidgets();
        thisBooking.getData();
    }
    render(){
        const thisBooking = this;

        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = utils.createDOMFromHTML(generatedHTML);
        thisBooking.element.appendChild(thisBooking.dom);
        thisBooking.dom.peopleAmount = thisBooking.element.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hourAmount = thisBooking.element.querySelector(select.booking.hoursAmount);
        thisBooking.dom.hourAmount = thisBooking.element.querySelector(select.booking.hoursAmount);
        thisBooking.dom.hourAmount = thisBooking.element.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePickerWrapper = thisBooking.element.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.HourPickerWrapper = thisBooking.element.querySelector(select.widgets.hourPicker.wrapper);
        }
    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hourAmountWidget = new AmountWidget(thisBooking.dom.hourAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerWrapper);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.HourPickerWrapper);

        thisBooking.dom.peopleAmount.addEventListener('updated', function(){
            console.log(thisBooking.dom.peopleAmount);
        })
        thisBooking.dom.hourAmount.addEventListener('updated', function(){
            console.log(thisBooking.dom.hourAmount);
        })
        thisBooking.dom.datePickerWrapper.addEventListener('updated', function(){
            console.log(thisBooking.dom.datePickerWrapper);
        })
        thisBooking.dom.HourPickerWrapper.addEventListener('updated', function(){
            console.log(thisBooking.dom.HourPickerWrapper);
        })
    }
    getData(){
        const thisBooking = this;

        const startDateParam =  settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endtDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endtDateParam,
            ],
            eventsCurrent : [
                settings.db.notRepeatParam,
                endtDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endtDateParam,
            ],
        };

        const urls = {
            booking:       settings.db.url + '/' +
                           settings.db.booking + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' +
                           settings.db.events   + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:  settings.db.url + '/' +
                           settings.db.events   + '?' + params.eventsRepeat.join('&'),
        };

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat)
        ])
            .then(function(allResponses){
                const bookingResponse = allResponses[0];
                const eventsCurrentResponse   = allResponses[1];
                const eventsRepeatResponse    = allResponses[2];
                return Promise.all([
                    bookingResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ])
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
                console.log(bookings);
                console.log(eventsCurrent);
                console.log(eventsRepeat);
            })


    }
}

export default Booking;