const searchTicker = (function() {
  const tickerSearch = document.querySelector("#tickerSearch");
  const form = document.querySelector("#search");
  const resultsDiv = document.querySelector("#results");
  const searchForm = document.querySelector("#search");

  const addToHoldingsButton = function() {
    searchForm.insertAdjacentHTML(
      "afterend",
      `<button id="addToHoldings">Add to Holdings</button>`
    );
  };

  return {
    getStockData: function() {
      form.addEventListener("submit", function(e) {
        e.preventDefault();
        const tickerValue = tickerSearch.value.toUpperCase();

        const errorReturn = error => {
          resultsDiv.innerHTML = "";
          resultsDiv.insertAdjacentHTML(
            "afterbegin",
            `<div id="no-results">No results matched your search</div>`
          );
        };

        fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${tickerValue}&interval=5min&apikey=11457D37ACGLX94V`
        )
          .then(function(response) {
            return response.json();
          })
          .then(function(data) {
            // console.log(data);
            return addResults(data);
          })
          .catch(function(e) {
            console.log(e);
            return errorReturn(e);
          });

        const addResults = results => {
          const recentResults = results["Time Series (5min)"];
          const recentResultsKeys = Object.keys(results["Time Series (5min)"]); // gets key of all timestamps
          const lastResultKey = recentResultsKeys[0]; // gets most recent timestamp
          const mostRecentPrices = recentResults[lastResultKey]; // obj of most recent price updates
          const mostRecentPricesArray = [];

          (function() {
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

          const stockPriceDataCells = document.querySelectorAll(".stockPrices");
          for (i = 0; i < stockPriceDataCells.length; i++) {
            stockPriceDataCells[i].innerHTML = mostRecentPricesArray[i];
          }
        };

        fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${tickerValue}&outputsize=full&apikey=11457D37ACGLX94V`
        )
          .then(function(response) {
            return response.json();
          })
          .then(function(data) {
            console.log(data);
            return createGraph(data);
          })
          .catch(function(error) {
            console.log(error);
          });

        const createGraph = function(data) {
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
      });
    }
  };
})();

searchTicker.getStockData();
