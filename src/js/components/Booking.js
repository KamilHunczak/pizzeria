import utils from "../functions.js";
import { classNames, select, settings, templates } from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";

class Booking{
    constructor(element){
        const thisBooking = this;

        thisBooking.element = element;
        thisBooking.bookedTable = {};

        thisBooking.render();
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    render(){
        const thisBooking = this;

        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = utils.createDOMFromHTML(generatedHTML);
        thisBooking.element.appendChild(thisBooking.dom);

        thisBooking.dom.peopleAmount      = thisBooking.element.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hourAmount        = thisBooking.element.querySelector(select.booking.hoursAmount);
        thisBooking.dom.hourAmount        = thisBooking.element.querySelector(select.booking.hoursAmount);
        thisBooking.dom.hourAmount        = thisBooking.element.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePickerWrapper = thisBooking.element.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.HourPickerWrapper = thisBooking.element.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables            = thisBooking.element.querySelectorAll(select.booking.tables);
        thisBooking.dom.starters          = thisBooking.element.querySelectorAll(select.booking.starter);
        thisBooking.dom.submitButton      = thisBooking.element.querySelector(select.booking.bookingSubmit);
        thisBooking.dom.phoneINPUT        = thisBooking.element.querySelector(select.booking.phone);
        thisBooking.dom.addressINPUT      = thisBooking.element.querySelector(select.booking.address);
        console.log(thisBooking.dom.addressINPUT);
    }

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hourAmountWidget = new AmountWidget(thisBooking.dom.hourAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerWrapper);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.HourPickerWrapper);

        thisBooking.element.addEventListener('updated', function(event){
            console.log(event.target);

            if(event.target.classList.contains(classNames.booking.hourPicker)||
                event.target.classList.contains(classNames.booking.datePicker)){
                thisBooking.bookTable(0);
                thisBooking.tableBooked = {};

            }
            thisBooking.updateDOM();
        })

        thisBooking.element.addEventListener('click', function(event){
            if(event.target.classList.contains(classNames.booking.table) &&
               !event.target.classList.contains(classNames.booking.tableBooked)){
                thisBooking.bookTable(event.target);
            }
        })

        thisBooking.dom.submitButton.addEventListener('click', (event)=>{
            event.preventDefault();

            thisBooking.sendBooking();
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
            fetch(urls.eventsRepeat),
        ])
            .then(function(allResponses){
                const bookingResponse         = allResponses[0];
                const eventsCurrentResponse   = allResponses[1];
                const eventsRepeatResponse    = allResponses[2];
                return Promise.all([
                    bookingResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ])
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {}
        console.log('bookings', bookings);
        console.log('eventsCurrent', eventsCurrent);
        console.log('eventsRepeat', eventsRepeat);

        for (let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;


        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate ; loopDate = utils.addDays(loopDate, 1)){
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        console.log(thisBooking);
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        let startHour = utils.hourToNumber(hour);
        !thisBooking.booked[date] ? thisBooking.booked[date] = {} : false;

        for (let i = startHour; i < startHour + duration; i += 0.5){
            !thisBooking.booked[date][i] ? thisBooking.booked[date][i] = [] : false;

            if(thisBooking.booked[date][i].indexOf(table) == -1){
                thisBooking.booked[date][i].push(table);
            } else {
                // console.log('booking conflict', date, i);
            }
        }
    }

    updateDOM(){
        const thisBooking = this;

        const date = thisBooking.datePicker.value;
        const hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let isAvailiable = false;

        if(!thisBooking.booked[date][hour]){
            isAvailiable = true;
        }

        if (isAvailiable == false){
            for (let table of thisBooking.dom.tables){
                const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
                if (thisBooking.booked[date][hour].includes(tableId)){
                    table.classList.add(classNames.booking.tableBooked);
                } else {
                    table.classList.remove(classNames.booking.tableBooked);
                }

            }
        }

    }

    bookTable(table){
        const thisBooking = this;

        for (let table of thisBooking.dom.tables){
            table.classList.remove(classNames.booking.tableChosen);
        }

        if(!table == 0){
            table.classList.add(classNames.booking.tableChosen);
        }


    }

    sendBooking(){
        const thisBooking =this;


        const url = settings.db.url + '/' + settings.db.booking;
        const payload = {};

        const starters = [];
        for (let starter of thisBooking.dom.starters){
            if(starter.checked){
                console.log(starter);
                starters.push(starter.value);
            }
        }
        const tableChosen = thisBooking.element.querySelector(select.booking.tableChosen);

        payload.table    = parseInt(tableChosen.getAttribute(settings.booking.tableIdAttribute));
        payload.date     = thisBooking.datePicker.value;
        payload.hour     = thisBooking.hourPicker.value;
        payload.duration = parseInt(thisBooking.hourAmountWidget.value);
        payload.ppl      = parseInt(thisBooking.peopleAmountWidget.value);
        payload.starers  = starters;
        payload.phone    = thisBooking.dom.phoneINPUT;
        payload.address    = thisBooking.dom.addressINPUT;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        };

        fetch(url, options)
        .then(function(){
            thisBooking.getData();
            thisBooking.updateDOM();
            thisBooking.bookTable(0);
        })
    }
}

export default Booking;