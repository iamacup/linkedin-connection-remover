
const readline = require('readline');
const fs = require('fs');
const util = require('util');
const axios = require('axios');
const child_process = require("child_process");

const cookie = null;

if(cookie === null) {
    console.log('You need to specify a cookie variable. This you can get from your web browser.');
    process.exit(1);
}

const csfr = `ajax:${cookie.split('ajax:')[1].split('"')[0]}`;

var names = fs.readFileSync('out.txt', 'utf8');

const getSearchResults = async (firstName, lastName) => {
    
    const url = `https://www.linkedin.com/voyager/api/search/cluster?guides=List(v-%3EPEOPLE,facetNetwork-%3EF,firstName-%3E${firstName},lastName-%3E${lastName})&start=0&count=10&origin=FACETED_SEARCH&q=guided&searchId=1540816623906`;

    const res = await axios.get(url, {
            headers: {
                'accept': `application/json`,
                'accept-encoding': `gzip, deflate, br`,
                'accept-language': `en-GB,en-US;q=0.9,en;q=0.8`,
                cookie,
                'csrf-token': csfr,
                'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36`,
                'x-requested-with': `XMLHttpRequest`,
                'x-restli-protocol-version': `2.0.0`,
                'guides': `List(v->PEOPLE,facetNetwork->F,firstName->${firstName},lastName->${lastName})`,
                'start': `0`,
                'count': `10`,
                'origin': `FACETED_SEARCH`,
                'q': `guided`,
                'searchId': `1540816623906`,
            }
        });

    const ids = [];

    for(let a=0; a<res.data.elements.length; a++) {
        const el = res.data.elements[a];

        if(el.elements.length > 1) {
            console.log('!!!! STRANGE RES FORMAT !!!!');
        }

        const id = el.elements[0].hitInfo['com.linkedin.voyager.search.SearchProfile'].id;

        ids.push(id);
    }

    const responses = [];

    for(let a=0; a<ids.length; a++) {

        const del = await axios.delete(`https://www.linkedin.com/voyager/api/relationships/connections/${ids[a]}`, {
                    headers: {
                        accept: 'application/json',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                        cookie,
                        'csrf-token': csfr,
                        origin: 'chrome-extension://abmpdeeefiojdkmdkhehppejdgnjegci',
                        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
                        'x-requested-with': 'XMLHttpRequest',
                        'x-restli-protocol-version': '2.0.0',
                    }
                });

        responses.push(del);

    }

    return responses;
}

let rateLimited = false;

const deleteUser = async (firstName, lastName, originString) => {


    if(rateLimited === true) {
        console.log('!!!!! RATE LIMITED - PAUSING !!!!!');

        child_process.execSync("sleep 200000");
    }

    try {
        console.log('----------');
        console.log(`Deleting ${firstName} ${lastName}`);

        const searchRes = await getSearchResults(firstName, lastName);

        if(searchRes.length > 1) {
            console.log('more than 1 delete request for user');
        }

        if(searchRes.length > 0) {
            let error = false;

            for(let a=0; a<searchRes.length; a++) {
                if(searchRes[a].status !== 200) {
                    error = true;
                } 
            }

            if(error === true) {
                console.log('There was a strange status code when deleting:');
            } else {
                rateLimited = false;
                console.log('Successfuly deleted');

                deleteLineFromFile(originString, 'out.txt');
            }
        } else {
            console.log('Could not find the user');
        }
        
    } catch (err) {
        let handled = false;

        try {
            if(err.response.status === 429) {
                rateLimited = true;
                handled=true;
            } else if(err.response.status === 400) {
                console.log('ERROR 400');
                handled=true;
            }
        } catch (err2) {
            //ignore
        }

        if(!handled) {
            console.log(err);
        }
    }
};

const deleteLineFromFile = (line, file) => {
    const fileContent = fs.readFileSync(file, 'utf8');

    const arr = fileContent.split('\n');

    const newArr = [];

    for(let a=0; a<arr.length; a++) {
        if(arr[a] === line) {

        } else {
            newArr.push(arr[a]);
        }
    }

    const newString = newArr.join('\n');

    fs.writeFileSync(file, newString);
};

const main = async () => {

    const arr = names.split('\n');

    for(let a=0; a<arr.length; a++) {
        const split = arr[a].split(':');

        const firstName = split[0];
        const lastName = split[1];

        await deleteUser(firstName, lastName, arr[a]);

    }

};

main();
