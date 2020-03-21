const formSearch = document.querySelector('.form-search'),
    inputCitiesFrom = formSearch.querySelector('.input__cities-from'),
    dropdownCitiesFrom = formSearch.querySelector('.dropdown__cities-from'),
    inputCitiesTo = formSearch.querySelector('.input__cities-to'),
    dropdownCitiesTo = formSearch.querySelector('.dropdown__cities-to'),
    inputDateDepart = formSearch.querySelector('.input__date-depart'),
    cheapestTicket = document.getElementById('cheapest-ticket'),
    otherCheapTickets = document.getElementById('other-cheap-tickets'),
    body = document.querySelector('body');

    // db/cities.json' - локальная БД городов


//онлайн база городов, прокси, ключ АПИ и БД по календарю цен
const citiesAPI = 'http://api.travelpayouts.com/data/ru/cities.json',
//const citiesAPI = 'dataBase/cities.json',
    proxy = 'https://cors-anywhere.herokuapp.com/',
    API_KEY = 'cc76f43272c6b284ed947b27e4e4a799',
    // Получение минимальных цен на перелёт для указанных даты вылета и городов вылета и назначения
    calendar = 'http://min-prices.aviasales.ru/calendar_preload',
    MAX_COUNT = 10; // количество карточек самых дешевых билетов


let city = [];





//Функции

const getData = (url, callback, reject = console.error) => {
try{
   
        
    const request = new XMLHttpRequest();

    request.open('GET', url);

    request.addEventListener('readystatechange', () => {
        if (request.readyState !== 4) return;

        if (request.status === 200) {
            callback(request.response);
        } else {
            reject(request.status);
        }

    });

request.send();
}catch (error){
    console.log(error);
}

};


const showCity = (input, list) => {
    list.textContent = '';

    if (input.value !== '') {

        cheapestTicket.style.display = 'none';
		otherCheapTickets.style.display = 'none';

        const filterCity = city.filter((item) => {
            const fixItem = item.name.toLowerCase();
            return fixItem.startsWith(input.value.toLowerCase());
            // return fixItem.includes(input.value.toLowerCase());
        });

        // другой способ сортировки ( без использования startsWith() )
		// const filterCityFirstLetters = filterCity.filter((item) => {
		// 	return item.name.slice(0, input.value.length) === input.value
		// })
		// console.log('filterCityFirstLetters: ', filterCityFirstLetters);

        //Условие правильного ввода наименования города

        if (filterCity.length === 0) {
			const li = document.createElement('li');
			li.classList.add('dropdown__city', 'error');
			li.textContent = 'Такого города нет!!!';
			list.append(li);
		} else {
        filterCity.forEach((item) => {
            const li = document.createElement('li');
            li.classList.add('dropdown__city');
            li.textContent = item.name;
            list.append(li);
        });
    }

    return;
}

};

const selectCity = (event, input, list) => {
    const target = event.target;
    if (target.tagName.toLowerCase() === 'li') {
        input.value = target.textContent;
        list.textContent = '';
    }
};

const getNameCity = (code) => {
    const objCity = city.find(item => item.code === code);
    return objCity.name;
};

const getDate = (date) => {
return new Date(date).toLocaleDateString('ru-Ru', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    
});
};

const getChanges = (num) => {
if(num){
return num === 1 ? 'С одной пересадкой': 'С двумя пересадками';
}else{
    return 'Без пересадок';
}
};

//https://www.aviasales.ru/search/SVX2905KGD1
const getLinkAviasales = (data) => {
let link = 'https://www.aviasales.ru/search/';

link += data.origin; 

const date = new Date(data.depart_date);

const day = date.getDate();

link += day < 10 ? '0' + day : day;

const month = date.getMonth()+1;

link += month < 10 ? '0' + month : month;

link += data.destination; // один взрослый билет

link += '1';

return link;
};

const createCard = (data) => {
const ticket = document.createElement('article');
ticket.classList.add('ticket');

let deep = '';

if(data){
    deep = `
        <h3 class="agent">${data.gate}</h3>
            <div class="ticket__wrapper">
                <div class="left-side">
                    <a href="${getLinkAviasales(data)}" target = "_blank" class = "button button__buy">Купить
                        за ${data.value}₽</a>
                </div>
                <div class="right-side">
                    <div class="block-left">
                        <div class="city__from">Вылет из города
                            <span class="city__name">${getNameCity(data.origin)}</span>
                        </div>
                        <div class="date">${getDate(data.depart_date)}</div>
                    </div>

                    <div class="block-right">
                        <div class="changes">${getChanges(data.number_of_changes)}</div>
                        <div class="city__to">Город назначения:
                            <span class="city__name">${getNameCity(data.destination)}</span>
                        </div>
                    </div>
                </div>
            </div>
    `;
}else{
    deep = '<h3>К сожалению на текущую дату билетов не нашлось!</h3>';
}

ticket.insertAdjacentHTML('afterbegin', deep);

return ticket;

};

const renderCheapDay = (cheapTicket) => {
    cheapestTicket.style.display = 'block';
    cheapestTicket.innerHTML = '<h2>Самый дешевый билет на выбранную дату</h2>';
    const ticket = createCard(cheapTicket[0]);
    cheapestTicket.insertAdjacentElement('beforeend', ticket);
    
};

const renderCheapYear = (cheapTickets) => {
    otherCheapTickets.style.display = 'block';
    otherCheapTickets.innerHTML = '<h2>Самые дешевые билеты на выбранные даты</h2>';

    cheapTickets.sort((a, b) => a.value - b.value);

    // cheapTickets.sort((a, b) => {
    //     if (a.value > b.value) {
    //       return 1;       
    //     }
    //     if (a.value < b.value) {
    //       return -1;
    //     }
    //        return 0;
    //   });

    for(let i = 0; i < cheapTickets.length && i < MAX_COUNT; i++){
        const ticket = createCard(cheapTickets[i]);
        otherCheapTickets.append(ticket);
    }

    console.log(cheapTickets);
};

const renderCheap = (data, date) => {
    const cheapTicketYear = JSON.parse(data).best_prices;

    const cheapTicketDay = cheapTicketYear.filter((item) => {
        return item.depart_date === date;

    });

    renderCheapDay(cheapTicketDay);
    renderCheapYear(cheapTicketYear);
    
};



// Обработчики событий

inputCitiesFrom.addEventListener('input', () => {
    showCity(inputCitiesFrom, dropdownCitiesFrom);
});

inputCitiesTo.addEventListener('input', () => {
    showCity(inputCitiesTo, dropdownCitiesTo);
});

dropdownCitiesFrom.addEventListener('click', () => {
    selectCity(event, inputCitiesFrom, dropdownCitiesFrom);
});

dropdownCitiesTo.addEventListener('click', () => {
    selectCity(event, inputCitiesTo, dropdownCitiesTo);
});

//Если неверно введён город
body.addEventListener('click', () => {
	dropdownCitiesFrom.innerHTML = '';
	dropdownCitiesTo.innerHTML = '';
});

formSearch.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = {
    from: city.find(item => item.name === inputCitiesFrom.value),
    to: city.find(item => item.name === inputCitiesTo.value),
    when: inputDateDepart.value
    };
    if (formData.from && formData.to) {
    
    const requestData = '?depart_date=' + formData.when +
    '&origin=' + formData.from.code +
    '&destination=' + formData.to.code +
    '&one_way=true&token=' + API_KEY;
    
    getData(proxy + calendar + requestData + API_KEY, (response) => {
    renderCheap(response, formData.when);
    });
    } else {
    alert('Введите названия городов')
    }
    
    });

    // const requestData = '?depart_date=' +
    //     formData.when + '&origin=' +
    //     formData.from + '&destination=' +
    //     formData.to + '&one_way=true&token=' + API_KEY;

    

//Вызовы Функций
getData(proxy + citiesAPI, (data) => {
    city = JSON.parse(data).filter((item) => {
        return item.name;
    });

    city.sort((a, b) => {
        if (a.name > b.name) {
            return 1;
        }
        if (a.name < b.name) {
            return -1;
        }
        return 0;
    });
    console.log(city);
});