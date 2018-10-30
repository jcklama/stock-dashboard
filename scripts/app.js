const searchTicker = (function () {
  const tickerSearch = document.querySelector("#tickerSearch");
  const form = document.querySelector("#search");
  const resultsDiv = document.querySelector("#results");
  const bottomSearchBar = document.querySelector(".bottom-search-bar");
  const holdingsTitle = document.querySelector("#holdings");
  const compTitle = document.querySelector("#composition");
  const hold = document.querySelector(".hold");

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

  const holdingsEvents = function () {
    const tickerValue = tickerSearch.value.toUpperCase();
    let recentPrice = 0;
    // AJAX call to get the most recent price
    fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${tickerValue}&interval=5min&apikey=11457D37ACGLX94V`
    )
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        recentPrice = getLastPrice(data);
      })
      .catch(function (error) {
        console.log(error);
      });

    const getLastPrice = function (data) {
      const objKeys = Object.keys(data["Time Series (5min)"]);
      const firstKey = objKeys[0];
      return (lastPrice = Number(
        data["Time Series (5min)"][firstKey]["4. close"]
      ).toFixed(2));
    };

    bottomSearchBar.addEventListener("click", function (e) {
      const holdingsButton = e.target;

      if (holdingsButton.matches("#addToHoldings")) {
        if (holdingsTitle.nextSibling.innerHTML === undefined) {
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
            <tr>
              <td>${tickerValue}</td>
              <td>$${recentPrice}</td>
              <td id="holdings-price">0
              </td>
              <td>
                <i class="fas fa-arrow-up"></i>
              </td>
              <td>
                <i class="fas fa-arrow-down"></i>
              </td>
              <td>
                <i class="fas fa-times"></i>
              </td>
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
          hold.addEventListener("click", function (e) {
            const clicked = e.target;
            if (clicked.matches(".fa-arrow-up")) {
              let innerQuant = document.querySelector("#holdings-price").innerHTML;

              // update     
              let updatedQuant = Number(innerQuant) + 1;
              quantity = updatedQuant;
              document.querySelector("#holdings-price").innerHTML = updatedQuant;
              // cannot do 'innerQuant = updatedQuant' b/c innerQuant only contains the value, not the element

              // update subtotal
              let updatedSubtotal = recentPrice * updatedQuant;
              document.querySelector('#subtotal-amount').innerHTML = `${updatedSubtotal.toFixed(2)}`;

              // update taxes & fees
              let taxesFeesUpdated = updatedSubtotal * 0.13;
              document.querySelector('#tf-amount').innerHTML = `${taxesFeesUpdated.toFixed(2)}`;

              // update total
              let totalUpdated = updatedSubtotal + taxesFeesUpdated;
              document.querySelector('#total-amount').innerHTML = `${totalUpdated.toFixed(2)}`;
            }
          });
        }
        if (compTitle.nextSibling.innerHTML === undefined) {
          compTitle.insertAdjacentHTML(
            "afterend",
            `<div class="comp-wrapper">
					<table class="summary">
						<tr>
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
						<tr>
							<td id="td1"></td>
							<td id="td2" class="totals"></td>
							<td id="td3"></td>
						</tr>
					</table>
				</div>`
          );
          hold.addEventListener("click", function (e) {
            const clicked = e.target;
            if (clicked.matches(".fa-arrow-up")) {
              const ticker = document.querySelector("#td1");
              const totalHoldings = document.querySelector('#td2');
              const portPercent = document.querySelector('#td3');
              const allHoldingAmounts = Array.prototype.slice.call(document.querySelectorAll('.totals'));

              console.log(allHoldingAmounts);
              const total = allHoldingAmounts.reduce((total, current) => {
                const inner = Number(current.innerHTML);
                return total + inner;
              }, 0);
              console.log(total);

              ticker.innerHTML = tickerValue;
              totalHoldings.innerHTML = document.querySelector('#total-amount').innerHTML;
              portPercent.innerHTML = `${document.querySelector()}`;



            }
          });
        }
      }
    });
  };

  return {
    getStockData: function () {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const tickerValue = tickerSearch.value.toUpperCase();

        fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${tickerValue}&interval=5min&apikey=11457D37ACGLX94V`
        )
          .then(function (response) {
            return response.json();
          })
          .then(function (data) {
            addResults(data);
          })
          .catch(function (e) {
            console.log(e);
            return errorReturn(e);
          });

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

        fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${tickerValue}&outputsize=full&apikey=11457D37ACGLX94V`
        )
          .then(function (response) {
            return response.json();
          })
          .then(function (data) {
            console.log(data);
            return createGraph(data);
          })
          .catch(function (error) {
            console.log(error);
          });

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
                  text: "Price",
                  position: "outer-middle"
                }
              }
            },
            point: {
              show: false
            },
            legend: {
              show: false
            }
          });
        };

        holdingsEvents();
      });
    }
  };
})();

const holdings = function () {
  // const hold = document.querySelector(".hold");
  // hold.addEventListener()
};

const composition = function () { };

searchTicker.getStockData();
// console.log(searchTicker.lastPrice);
// searchTicker.addToHoldings();
holdings();
