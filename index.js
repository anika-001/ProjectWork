
const fs = require('fs');
const yargs = require('yargs'); //for commandline args
const express = require('express');
const bodyParser = require('body-parser');
const LoanDataArr = JSON.parse(fs.readFileSync('./mydata.json'));

const app = express();
port = 3000;
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const output = [];

app.post('/run', (req, res) => {
    const { n, k } = req.body;
    lendingOracle(n, k);
    res.status(201).send({
        message: 'Request Succesful!',
        data: output
    })
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

function lendingOracle(n, k) {
    // Keep a counter for number of current active loans
    var ActiveLoans = [];

    // Keep an array of blacklisted ids in the start.
    var BlacklistedIds = []

    // Keep an array of blacklisted ids that give some kind of profit and allow them for 1 time at least. (Calculation of profit ratios for these would be Total repayable amount - principal / principal amount)
    var BlacklistedIdsProfit = []

    // Current balance
    var CurrentBalance = 0;
    var Profit;


    //Input Var N and K

    CurrentBalance = n;
    var map = { "01": [], "02": [], "03": [], "04": [], "05": [], "06": [], "07": [], "08": [], "09": [], "10": [], "11": [], "12": [] };
    var keys = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    for (var i = 0; i < LoanDataArr.length; i++) {
        LoanDataArr[i]["Profit"] = LoanDataArr[i]["repaid_amount"] - LoanDataArr[i]["principal"];

        if (!LoanDataArr[i].repayments.length) { BlacklistedIds.push(LoanDataArr[i].customer_id); LoanDataArr.splice(i, 1); continue; }//get all the blacklisted IDs and remove them 
        else {
            const diffInMs = new Date(LoanDataArr[i].repayments[LoanDataArr[i].repayments.length - 1].date) - new Date(LoanDataArr[i].disbursement_date)//get all the black listed ids that can be run atleast once
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
            if (diffInDays > 90) {
                BlacklistedIds.push(LoanDataArr[i].customer_id);
                //active date of repayment in under 90 days

                let temp = LoanDataArr[i].repayments;
                temp.sort((a, b) => new Date(b.date) - new Date(a.date))
                for (z = 0; z < temp.length; z++) {
                    if (new Date(temp[z].date) - new Date(LoanDataArr[i].disbursement_date) <= 90) {
                        LoanDataArr[i].repayments.push({ "date": temp[z].date })
                        break
                    }
                }
            }
        }
  
        map[LoanDataArr[i].disbursement_date.split("-")[1]].push(LoanDataArr[i]);
    }

    currentloans = [];
    allloans = [];
    currentamount = [];
    currentday = 1;
    allprofit = 0;
//go day wise
    for (day =1; day < 365; day++) {
        //takeloan aplications
        for (i1 = 0; i1 < LoanDataArr.length; i1++) {
            while (currentloans.length <= k && CurrentBalance > 0 && CurrentBalance - LoanDataArr[i1].principal > 0 && LoanDataArr[i1]) {
                currentloans.push(LoanDataArr[i1]);
          
                CurrentBalance -=LoanDataArr[i1].principal;
                allloans.push(LoanDataArr[i1].application_id);
                i1++;
            }
            //if the loan is repaying today, repay, add the profit to main balance and cotinue.
            for ( i2=0;i2<currentloans.length;i2++) {

                if(new Date(currentloans[i2].repayments[currentloans[i2].repayments.length - 1].date).getFullYear()==2021)
                if (dateFromDay(day, 2021) == new Date(currentloans[i2].repayments[currentloans[i2].repayments.length - 1].date).toDateString()) {
              
                    removeA(currentloans, currentloans[i2]);
                    allprofit += currentloans[i2].Profit;
                    CurrentBalance += currentloans[i2].repaid_amount;

                }
            }
        }

    }
console.log(allloans);
}

function dateFromDay(year, day) {//gives date from a given day of the year in number i.e. 3 -> Wed Jan 03 2021
    return new Date(year, 0, day).toDateString();
}
function removeA(arr) { //remove array index of given vallue.
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}




// **** Additional comments about algorithm and further optimisation *******


// Maintains array sorted according to profit, another sorted according to repayment date
// Sort according to the month, date, profit
// Set a goal : x loans per day - See to it that the balance doesnt become negative
// Each day check if any repayments are to be done today. Check if any loan is completed and to be deleted. Take x loans.
// If tried to exceed K, ignore the loan, continue.


// Additionally, currently not required but for file upload optimisation and optimal read through we can use soomething like this too
// var stream = fs.createReadStream(filePath, {flags: 'r', encoding: 'utf-8'});
// var buf = '';

// stream.on('data', function(d) {
//     buf += d.toString(); // when data is read, stash it in a string buffer
//     pump(); // then process the buffer
// });

// function pump() {
//     var pos;

//     while ((pos = buf.indexOf('\n')) >= 0) { // keep going while there's a newline somewhere in the buffer
//         if (pos == 0) { // if there's more than one newline in a row, the buffer will now start with a newline
//             buf = buf.slice(1); // discard it
//             continue; // so that the next iteration will start with data
//         }
//         processLine(buf.slice(0,pos)); // hand off the line
//         buf = buf.slice(pos+1); // and slice the processed data off the buffer
//     }
// }

// function processLine(line) { // here's where we do something with a line

//     if (line[line.length-1] == '\r') line=line.substr(0,line.length-1); // discard CR (0x0D)

//     if (line.length > 0) { // ignore empty lines
//         var obj = JSON.parse(line); // parse the JSON
//         console.log(obj); // do something with the data here!
//     }
// }
//file optimisation code end