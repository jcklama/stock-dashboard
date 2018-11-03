const searchTicker = (function () {
  const tickerSearch = document.querySelector("#tickerSearch");
  const form = document.querySelector("#search");
  const resultsDiv = document.querySelector("#results");
  const holdTitle = document.querySelector('#holdings');
  const bottomSearchBar = document.querySelector(".bottom-search-bar");
  const holdingsTitle = document.querySelector("#holdings");

  const addToHoldingsButton = function () {
    form.insertAdjacentHTML(
      "afterend",
      `<button id="addToHoldings">Add to Holdings</button>`
    );
  };

  const errorReturn = error => {
    resultsDiv.innerHTML = "";
    resultsDiv.insertAdjacentHTML(
      "afterbegin",
      `<div id="no-results">No results matched your search</div>`
    );
  };

  const addResults = results => {
    const recentResults = results["Time Series (5min)"];
    const recentResultsKeys = Object.keys(results["Time Series (5min)"]); // gets key of all timestamps
    const lastResultKey = recentResultsKeys[0]; // gets most recent timestamp
    const mostRecentPrices = recentResults[lastResultKey]; // obj of most recent price updates
    const mostRecentPricesArray = [];

    (function () {
      if (document.querySelector("#addToHoldings")) {
        document.querySelector("#addToHoldings").remove();
      }
      addToHoldingsButton();
    })();

    for (let key in mostRecentPrices) {
      if (key === "5. volume") {
        mostRecentPricesArray.push(
          Number(mostRecentPrices[key]).toFixed(0)
        );
      } else {
        mostRecentPricesArray.push(
          Number(mostRecentPrices[key]).toFixed(2)
        );
      }
    }
    searchTicker.recentPrice = mostRecentPricesArray[3];

    resultsDiv.innerHTML = "";
    resultsDiv.insertAdjacentHTML(
      "afterbegin",
      `
      <table id="resultsTable">
        <tr>
          <th>Open</th>
          <th>High</th>
          <th>Low</th>
          <th>Close</th>
          <th>Volume</th>
        </tr>
        <tr>
          <td class="stockPrices"></td>
          <td class="stockPrices"></td>
          <td class="stockPrices"></td>
          <td class="stockPrices"></td>
          <td class="stockPrices"></td>
        </tr>
      </table>
    `
    );
    //updating values of the stock prices above graph
    const stockPriceDataCells = document.querySelectorAll(".stockPrices");
    for (i = 0; i < stockPriceDataCells.length; i++) {
      stockPriceDataCells[i].innerHTML = mostRecentPricesArray[i];
    }
  };

  const createGraph = function (data) {
    const dataObject = data["Time Series (Daily)"];
    const chartArray = Object.keys(dataObject).map(timestamp => {
      return dataObject[timestamp]["4. close"];
    });
    const timestamps = Object.keys(dataObject);

    for (i = 0; i < timestamps.length; i++) {
      const spliced = timestamps[0];
      timestamps.splice(0, 1);
      timestamps.splice(timestamps.length - i, 0, spliced);
    }
    const lastYear = timestamps.slice(
      timestamps.length - 365,
      timestamps.length
    );
    lastYear.unshift("key");

    for (i = 0; i < chartArray.length; i++) {
      const spliced = chartArray[0];
      chartArray.splice(0, 1);
      chartArray.splice(chartArray.length - i, 0, spliced);
    }
    const lastYearData = chartArray.slice(
      timestamps.length - 365,
      timestamps.length
    );
    lastYearData.unshift("Close Price"); // data does not actually go one year back; missing data

    const chart = c3.generate({
      bindto: "#chart",
      data: {
        x: "key",
        columns: [lastYear, lastYearData]
      },
      axis: {
        x: {
          tick: {
            format: "%Y-%m-%d",
            rotate: 60
          },
          type: "timeseries"
        },
        y: {
          label: {
            text: `Price (${searchTicker.tickerValue})`,
            position: "outer-middle"
          }
        }
      },
      point: {
        show: false
      },
      legend: {
        show: false
      },
    });
  };

  return {
    recentPrice: 0,
    tickerValue: "",
    intializeThroughSearch: function () {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const tickerValue = tickerSearch.value.toUpperCase();
        searchTicker.tickerValue = tickerValue;

        fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${tickerValue}&interval=5min&apikey=11457D37ACGLX94V`
        )
          .then(function (response) {
            return response.json();
          })
          .then(function (data) {
            addResults(data);

            bottomSearchBar.addEventListener("click", function (e) {
              const holdingsButton = e.target;

              if (holdingsButton.matches("#addToHoldings") && holdingsTitle.nextElementSibling === null) {
                holdingsSection.intializeHoldings();
                compSection.initializeComp();
                holdingsSection.addHoldingsRow();
              }
              else if (holdingsButton.matches("#addToHoldings") && holdTitle.nextElementSibling !== null) {
                holdingsSection.addHoldingsRow();
              }
            })
          })
          .catch(function (e) {
            console.log(e);
            return errorReturn(e);
          });

        fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${tickerValue}&outputsize=full&apikey=11457D37ACGLX94V`
        )
          .then(function (response) {
            return response.json();
          })
          .then(function (data) {
            return createGraph(data);
          })
          .catch(function (e) {
            console.log(e);
          });
      });
    }
  };
})();


const holdingsSection = (function () {
  const holdingsTitle = document.querySelector("#holdings");
  const tickerSearch = document.querySelector("#tickerSearch");

  return {
    subTotalOfCurrent: 0,
    holdingsCounter: 0,
    intializeHoldings: function () {
      holdingsTitle.insertAdjacentHTML(
        "afterend",
        `<div class="holdings">
                  <div class="tbl-subtotal-separator">
                    <table id="holdings-table">
                      <tr id="holdings-headings">
                        <th>STOCK</th>
                        <th>PRICE</th>
                        <th>QUANTITY</th>
                      </tr>
                    </table>
                  </div>
                <div class="subtotals">
                  <div class="subtotal">
                    <h5>Subtotal</h5>
                    <p id="subtotal-amount"></p>
                  </div>
                  <div class="taxes">
                    <h5>Taxes & Fees</h5>
                    <p id="tf-amount"></p>
                  </div>
                  <div class="total">
                    <h5>Total</h5>
                    <p id="total-amount"></p>
                  </div>
                </div>
              </div>`
      );
    },
    addHoldingsRow: function () {
      const tickerValue = tickerSearch.value.toUpperCase();

      let recentPrice = searchTicker.recentPrice;

      const checkUniqueStock = function () {
        const tickerSymbols = Array.prototype.slice.call(document.querySelectorAll('.ticker-symb'));
        const checkSameTicker = tickerSymbols.filter((ticker) => {
          if (ticker.innerHTML.toUpperCase() === tickerValue) {
            return true;
          }
        });
        return checkSameTicker.length;
      }

      if (checkUniqueStock() === 0) {
        const holdHeadings = document.querySelector('#holdings-headings');
        holdHeadings.insertAdjacentHTML(
          "afterend",
          `<tr class="holding-row holding-row-${holdingsSection.holdingsCounter}">
                <td class="ticker-symb ticker-symb-${holdingsSection.holdingsCounter}">${tickerValue}</td>
                <td class="holdings-price holdings-price-${holdingsSection.holdingsCounter}">$${recentPrice}</td>
                <td class="holdings-quant holdings-quant-${holdingsSection.holdingsCounter}">0
                </td>
                <td>
                  <i class="fas fa-arrow-up fa-arrow-up-${holdingsSection.holdingsCounter}"></i>
                </td>
                <td>
                  <i class="fas fa-arrow-down fa-arrow-down-${holdingsSection.holdingsCounter}"></i>
                </td>
                <td>
                  <i class="fas fa-times fa-times-${holdingsSection.holdingsCounter}"></i>
                </td>
              </tr>`
        );
        const upArrow = document.querySelector(`.fa-arrow-up-${holdingsSection.holdingsCounter}`);
        const downArrow = document.querySelector(`.fa-arrow-down-${holdingsSection.holdingsCounter}`);
        const times = document.querySelector(`.fa-times-${holdingsSection.holdingsCounter}`);

        upArrow.addEventListener("click", function (e) {
          const clicked = e.target;
          const clickedMapper = Array.prototype.slice.call(clicked.classList)[2];
          const extractedMapper = clickedMapper.match(/\d/)[0]; // the number of the class with numerical index
          let innerQuant = Number(document.querySelector(`.holdings-quant-${extractedMapper}`).innerHTML);

          // update quantity
          let updatedQuant = innerQuant + 1;
          document.querySelector(`.holdings-quant-${extractedMapper}`).innerHTML = updatedQuant;
          updateTotals();

          const tickerOfMapped = document.querySelector(`.ticker-symb-${extractedMapper}`).innerHTML;
          const priceOfMapped = document.querySelector(`.holdings-price-${extractedMapper}`).innerHTML.match(/\d+.\d+/)[0];
          const quantOfMapped = document.querySelector(`.holdings-quant-${extractedMapper}`).innerHTML
          compSection.addCompRow(tickerOfMapped, priceOfMapped, quantOfMapped);
        });

        downArrow.addEventListener("click", function (e) {
          const clicked = e.target;
          const clickedMapper = Array.prototype.slice.call(clicked.classList)[2];
          const extractedMapper = clickedMapper.match(/\d/)[0];
          let innerQuant = Number(document.querySelector(`.holdings-quant-${extractedMapper}`).innerHTML);

          // update quantity
          if (innerQuant > 0) {
            let updatedQuant = innerQuant - 1;
            document.querySelector(`.holdings-quant-${extractedMapper}`).innerHTML = updatedQuant;
            updateTotals();

            const tickerOfMapped = document.querySelector(`.ticker-symb-${extractedMapper}`).innerHTML;
            const priceOfMapped = Number(document.querySelector(`.holdings-price-${extractedMapper}`).innerHTML.match(/\d+.\d+/)[0]);
            const quantOfMapped = Number(document.querySelector(`.holdings-quant-${extractedMapper}`).innerHTML);
            compSection.addCompRow(tickerOfMapped, priceOfMapped, quantOfMapped);
          }
        });

        times.addEventListener('click', function (e) {
          const clicked = e.target;
          const clickedMapper = Array.prototype.slice.call(clicked.classList)[2];
          const extractedMapper = clickedMapper.match(/\d/)[0];

          const mappedTicker = document.querySelector(`.ticker-symb-${extractedMapper}`).innerHTML;
          const compRows = document.querySelectorAll('.comp-row');

          compRows.forEach((row) => {
            const compTicker = row.children[0].innerHTML;
            const mapperOfTheRow = row.children[0].classList[1].match(/\d/)[0];
            if (mappedTicker === compTicker) {
              document.querySelector(`.comp-row-${mapperOfTheRow}`).remove();
            }
          });

          document.querySelector(`.holding-row-${extractedMapper}`).remove();
          updateTotals();
          compSection.recalcCompPercentages();

          const holdingHeadings = document.querySelector('#holdings-headings');
          const subtotal = document.querySelector('#subtotal-amount');
          const tAndF = document.querySelector('#tf-amount');
          const total = document.querySelector('#total-amount');
          if (holdingHeadings.nextElementSibling === null) {
            subtotal.innerHTML = "";
            tAndF.innerHTML = "";
            total.innerHTML = "";
          }
        });

        const updateTotals = function () {
          const holdingRows = Array.prototype.slice.call(document.querySelectorAll(`.holding-row`));

          // update subtotal
          const subTotal = holdingRows.reduce((total, current) => {
            const quantity = Number(current.children[2].innerHTML);
            const price = Number(current.children[1].innerHTML.match(/\d+.\d+/)[0]);
            return (total + (quantity * price));
          }, 0);
          document.querySelector('#subtotal-amount').innerHTML = `$${subTotal.toFixed(2)}`;
          holdingsSection.subTotalOfCurrent = subTotal;

          // update taxes & fees
          let taxesFeesUpdated = subTotal * 0.13;
          document.querySelector('#tf-amount').innerHTML = `$${taxesFeesUpdated.toFixed(2)}`;

          // update total
          let totalUpdated = subTotal + taxesFeesUpdated;
          document.querySelector('#total-amount').innerHTML = `$${totalUpdated.toFixed(2)}`;
        }

        holdingsSection.holdingsCounter += 1;
      }
    }
  };
})();

const compSection = (function () {
  const compTitle = document.querySelector("#composition");
  return {
    compRowCounter: 0,
    initializeComp: function () {
      compTitle.insertAdjacentHTML(
        "afterend",
        `<div class="comp-wrapper">
            <table class="summary">
              <tr id="composition-headings">
                <th id="stock-heading">
                  Stock
                </th>
                <th id="total-holdings">
                  Total Holdings 
                </th>
                <th id="portfolio-heading">
                  Portfolio %
                </th>
              </tr>
            </table>
          </div>`
      );
    },
    addCompRow: function (tickerOfMapped, priceOfMapped, quantOfMapped) {

      const checkIfStockInComp = function () {
        const compTickers = Array.prototype.slice.call(document.querySelectorAll(".td-symbol"));
        const checkAddedComp = compTickers.filter((ticker) => {
          if (ticker.innerHTML.toUpperCase() === tickerOfMapped) {
            return true;
          }
        });
        return checkAddedComp.length;
      }

      const updateValues = function (ticker, totalHoldings) {
        const priceTimesQuant = priceOfMapped * quantOfMapped;

        const updatePercentages = function () {
          const holdingRows = Array.prototype.slice.call(document.querySelectorAll(`.holding-row`));
          const subTotal = holdingRows.reduce((total, current) => {
            const quantity = Number(current.children[2].innerHTML);
            const price = Number(current.children[1].innerHTML.match(/\d+.\d+/)[0]);
            return total + quantity * price;
          }, 0);

          const percentageColumn = Array.prototype.slice.call(document.querySelectorAll('.td-pcnt'));
          percentageColumn.forEach((row) => {
            const rowMapper = Number(row.classList[1].match(/\d/)[0])
            const rowStockTotal = Number(document.querySelector(`.td-totals-${rowMapper}`).innerHTML.match(/\d+.\d+/));

            if ((rowStockTotal / subTotal * 100) % 1 === 0) {
              row.innerHTML = `${(rowStockTotal / subTotal) * 100}%`;
            }
            else if (rowStockTotal === 0 && subTotal === 0) {
              row.innerHTML = "0%";
            }
            else {
              row.innerHTML = `${((rowStockTotal / subTotal) * 100).toFixed(2)}%`;
            }
          });
        }

        ticker.innerHTML = tickerOfMapped;
        totalHoldings.innerHTML = `$${priceTimesQuant.toFixed(2)}`;
        updatePercentages();
      }

      if (checkIfStockInComp() === 0) {
        const compHeadings = document.querySelector("#composition-headings");
        compHeadings.insertAdjacentHTML('afterend',
          `<tr class="comp-row comp-row-${compSection.compRowCounter}">
            <td class="td-symbol td-symbol-${compSection.compRowCounter}"></td>
            <td class="td-totals td-totals-${compSection.compRowCounter}"></td>
            <td class="td-pcnt td-pcnt-${compSection.compRowCounter}"></td>
          </tr>`);

        const ticker = document.querySelector(`.td-symbol-${compSection.compRowCounter}`);
        const totalHoldings = document.querySelector(`.td-totals-${compSection.compRowCounter}`);

        updateValues(ticker, totalHoldings);

        compSection.compRowCounter += 1;
      }
      else {
        const getNewMapper = function () {
          const compTickers = Array.prototype.slice.call(document.querySelectorAll(".td-symbol"));
          const compareList = compTickers.filter((ticker) => {
            if (ticker.innerHTML.toUpperCase() === tickerOfMapped) {
              return true;
            }
          });
          const getMatchedMapper = compareList.map((matched) => {
            return matched.classList[1].match(/\d/)[0];
          });
          return getMatchedMapper[0];
        }

        const ticker = document.querySelector(`.td-symbol-${getNewMapper()}`);
        const totalHoldings = document.querySelector(`.td-totals-${getNewMapper()}`);

        updateValues(ticker, totalHoldings);
      }
    },
    recalcCompPercentages: function () {
      const holdingRows = Array.prototype.slice.call(document.querySelectorAll(`.holding-row`));
      const subTotal = holdingRows.reduce((total, current) => {
        const quantity = Number(current.children[2].innerHTML);
        const price = Number(current.children[1].innerHTML.match(/\d+.\d+/)[0]);
        return total + quantity * price;
      }, 0);

      const percentageColumn = Array.prototype.slice.call(document.querySelectorAll('.td-pcnt'));
      percentageColumn.forEach((row) => {
        const rowMapper = Number(row.classList[1].match(/\d/)[0]);
        const rowStockTotal = Number(document.querySelector(`.td-totals-${rowMapper}`).innerHTML.match(/\d+.\d+/));

        if ((rowStockTotal / subTotal * 100) % 1 === 0) {
          row.innerHTML = `${(rowStockTotal / subTotal) * 100}%`;
        }
        else if (rowStockTotal === 0 && subTotal === 0) {
          row.innerHTML = "0%";
        }
        else {
          row.innerHTML = `${((rowStockTotal / subTotal) * 100).toFixed(2)}%`;
        }
      });
    }
  }
})();

searchTicker.intializeThroughSearch();
