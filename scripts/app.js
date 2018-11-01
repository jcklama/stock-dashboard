const searchTicker = (function () {
  const tickerSearch = document.querySelector("#tickerSearch");
  const form = document.querySelector("#search");
  const resultsDiv = document.querySelector("#results");
  const holdTitle = document.querySelector('#holdings');

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
    setUpSearchFieldResults: function () {
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
            if (holdTitle.nextElementSibling === null) {
              holdingsSection.intializeHoldings();
              holdingsSection.addAddAndHoldingsListeners();
              compSection.initializeComp();
              compSection.addCompRowListener();
            }
            else if (holdTitle.nextElementSibling !== null) {
              holdingsSection.addAddAndHoldingsListeners();
            }
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
  const bottomSearchBar = document.querySelector(".bottom-search-bar");
  const holdingsTitle = document.querySelector("#holdings");
  const tickerSearch = document.querySelector("#tickerSearch");

  return {
    holdingsCounter: 0,
    arrayOfTickers: [],
    intializeHoldings: function () {
      bottomSearchBar.addEventListener("click", function (e) {
        const holdingsButton = e.target;

        if (holdingsButton.matches("#addToHoldings") && holdingsTitle.nextElementSibling === null) {
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
        }
        tickerSearch.value = '';
      })
    },
    addAddAndHoldingsListeners: function () {
      const tickerValue = tickerSearch.value.toUpperCase();
      holdingsSection.arrayOfTickers.push(tickerValue);

      let recentPrice = searchTicker.recentPrice;

      // to be added as an event listener
      const addHoldingAndUpdate = function (e) {
        const holdingsButton = e.target;

        const checkNumberOfSearchedStock = function () {
          const tickerSymbols = Array.prototype.slice.call(document.querySelectorAll('.ticker-symb'));
          const checkSameTicker = tickerSymbols.filter((ticker) => {
            if (ticker.innerHTML.toUpperCase() === tickerValue) {
              return true;
            }
          });
          return checkSameTicker.length;
        }

        if (holdingsButton.matches("#addToHoldings") && holdingsTitle.nextElementSibling !== null && checkNumberOfSearchedStock() === 0) {
          const holdHeadings = document.querySelector('#holdings-headings');
          holdHeadings.insertAdjacentHTML(
            "afterend",
            `<tr class="holding-row holding-row-${holdingsSection.holdingsCounter}">
                <td class="ticker-symb ticker-symb-${holdingsSection.holdingsCounter}">${tickerValue}</td>
                <td class="holdings-price holdings-price-${holdingsSection.holdingsCounter}">${recentPrice}</td>
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
            }
          });

          times.addEventListener('click', function (e) {
            const clicked = e.target;
            const clickedMapper = Array.prototype.slice.call(clicked.classList)[2];
            const extractedMapper = clickedMapper.match(/\d/)[0];

            // remove the ticker symbol from arrayOfTickers
            holdingsSection.arrayOfTickers.filter((ticker) => {
              if (ticker !== document.querySelector(`.ticker-symb-${extractedMapper}`).innerHTML) {
                return true;
              }
            });
            document.querySelector(`.holding-row-${extractedMapper}`).remove();
            updateTotals();
            bottomSearchBar.removeEventListener("click", addHoldingAndUpdate);
            // bottomSearchBar.addEventListener("click", addHoldingAndUpdate);
          });

          const updateTotals = function () {
            const holdingRows = Array.prototype.slice.call(document.querySelectorAll(`.holding-row`));

            // update subtotal
            const subTotal = holdingRows.reduce((total, current) => {
              const quantity = Number(current.children[2].innerHTML);
              const price = Number(current.children[1].innerHTML)
              return (total + (quantity * price));
            }, 0);
            document.querySelector('#subtotal-amount').innerHTML = `${subTotal.toFixed(2)}`;

            // update taxes & fees
            let taxesFeesUpdated = subTotal * 0.13;
            document.querySelector('#tf-amount').innerHTML = `${taxesFeesUpdated.toFixed(2)}`;

            // update total
            let totalUpdated = subTotal + taxesFeesUpdated;
            document.querySelector('#total-amount').innerHTML = `${totalUpdated.toFixed(2)}`;
          }

          holdingsSection.holdingsCounter += 1;
        };
      };
      bottomSearchBar.addEventListener("click", addHoldingAndUpdate);
    }
  };
})();

const compSection = (function () {
  const compTitle = document.querySelector("#composition");
  const bottomSearchBar = document.querySelector(".bottom-search-bar");
  const hold = document.querySelector(".hold");
  const tickerSearch = document.querySelector("#tickerSearch");

  return {
    compRowCounter: 0,
    initializeComp: function () {
      bottomSearchBar.addEventListener("click", function (e) {
        const holdingsButton = e.target;

        if (holdingsButton.matches("#addToHoldings") && compTitle.nextElementSibling === null) {
          compTitle.insertAdjacentHTML(
            "afterend",
            `<div class="comp-wrapper">
            <table class="summary">
              <tr id="comp-headings">
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
        }
      });
    },
    addCompRowListener: function () {
      const tickerValue = tickerSearch.value.toUpperCase();

      hold.addEventListener("click", function (e) {
        const clicked = e.target;
        const compHeadings = document.querySelector("#comp-headings");
        const compTickers = Array.prototype.slice.call(document.querySelectorAll(".td-symbol"));
        const checkAddedComp = compTickers.filter((ticker) => {
          if (ticker.innerHTML === holdingsSection.arrayOfTickers[holdingsSection.arrayOfTickers.length - 1]) {
            return true;
          }
        });

        if (clicked.matches(".fa-arrow-up") && checkAddedComp.length === 0) {
          compHeadings.insertAdjacentHTML('afterend',
            `<tr>
          <td class="td-symbol td-symbol-${compSection.compRowCounter}"></td>
          <td class="td-totals></td>
          <td class="td-pcnt"></td>
        </tr>`);

          const ticker = document.querySelector(".td-symbol");
          const totalHoldings = document.querySelector('.td-totals');
          const portPercent = document.querySelector('.td-pcnt');
          const allHoldingAmounts = Array.prototype.slice.call(document.querySelectorAll('.td-totals'));

          // console.log(allHoldingAmounts);
          const total = allHoldingAmounts.reduce((total, current) => {
            const inner = Number(current.innerHTML);
            return total + inner;
          }, 0);
          // console.log(total);

          ticker.innerHTML = tickerValue;
          // totalHoldings.innerHTML = document.querySelector('.td-totals').innerHTML;
          // portPercent.innerHTML = `${document.querySelector()}`;

          compSection.compRowCounter += 1;

        }
      });
    }
  }
})();

searchTicker.setUpSearchFieldResults();

