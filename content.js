// Tableからデータ抜き取り。連想配列に。
// {気温: [10, 11, 10]}みたいな
function getData(table) {
  let res = {};
  let rowCount = table.rows.length;
  let colCount = table.rows[0].cells.length;

  for (let j = 0; j < colCount; j++) {
    let vals = []
    for (let i = 2; i < rowCount; i++) {
      vals.push(parseFloat(table.rows[i].cells[j].textContent));
    }
    res[table.rows[0].cells[j].textContent] = vals;
  }
  return res;
}

function showGraph() {
  // データ取得
  // 濃い薄い = 今日または昨日
  let deepTable = document.getElementById('tbl_list');
  let paleTable;
  let xhr = new XMLHttpRequest();

  let method = 'GET';
  let async = true;
  let target, dayDeep, dayPale;
  if (document.URL.match('today')) {
    target = document.URL.replace('today', 'yesterday');
    dayDeep = '今日';
    dayPale = '昨日';
  } else {
    target = document.URL.replace('yesterday', 'today');
    dayDeep = '昨日';
    dayPale = '今日';
  }

  xhr.open(method, target, async);

  xhr.responseType = 'document';
  xhr.onload = function (e) {
    if (this.status === 200) {
      paleTable = this.responseXML.getElementById('tbl_list');
    } else {
      console.error('unexpected status code: ' + this.status);
    };
  }
  xhr.addEventListener('load', (e) => callback());
  xhr.send();

  function callback() {
    let deepData = getData(deepTable);
    let paleData = getData(paleTable);

    let Dataset = [{
      label: `降水量(${dayDeep})`,
      data: deepData.降水量,
      borderColor: "rgba(0,0,255,1)",
      backgroundColor: "rgba(0,0,255,0.5)",
      yAxisID: "y-axis-2"
    }];
    let YAxes = [{
      id: "y-axis-2",
      position: "right",
      ticks: {
        suggestedMax: 10,
        min: 0,
        stepSize: 5,
        callback: function (value, index, values) {
          return value + 'mm'
        }
      },
      gridLines: {
        drawOnChartArea: false,
      }
    }];
    if ('気温' in deepData) {
      // pushでなくてunshiftなのはグラフの重なり順による
      Dataset.unshift({
        label: `気温(${dayDeep})`,
        type: "line",
        data: deepData.気温,
        borderColor: "rgba(255,50,60,0.9)",
        backgroundColor: "rgba(0,0,0,0)",
        yAxisID: "y-axis-1"
      },
        {
          label: `気温(${dayPale})`,
          type: "line",
          data: paleData.気温,
          borderColor: "rgba(255,50,60,0.4)",
          backgroundColor: "rgba(0,0,0,0)",
          yAxisID: "y-axis-1"
        });
      YAxes.unshift({
        id: "y-axis-1",
        ticks: {
          stepSize: 5,
          callback: function (value, index, values) {
            return value + '℃'
          }
        }
      });
    }

    // グラフ表示
    let mainCanvas = document.createElement("canvas");
    deepTable.insertAdjacentElement('beforebegin', mainCanvas);
    let ctx = mainCanvas.getContext("2d");

    let myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: deepData.時刻,
        datasets: Dataset
      },
      options: {
        title: {
          display: false,
          position: 'bottom',
          text: 'アメダスグラフ'
        },
        legend: {
          display: true,
          position: 'bottom'
        },
        scales: {
          yAxes: YAxes
        },
      }
    });
  };
}

function showLinkPast() {
  // 地点情報
  let amedasID = document.URL.split('-')[1].split('.')[0];
  let prec_no = ameTable["prec_no"][amedasID];
  let block_no = ameTable["block_no"][amedasID];

  // 日付情報（昨日の）
  let kinou = new Date();  // 今日
  kinou.setDate(kinou.getDate() - 1) // 昨日
  let year = kinou.getFullYear();
  let month = kinou.getMonth() + 1;
  let day = kinou.getDate();

  // リンクを追加
  let kakoA = document.createElement('a');
  kakoA.href = `https://www.data.jma.go.jp/obd/stats/etrn/index.php?prec_no=${prec_no}&block_no=${block_no}&year=${year}&month=${month}&day=${day}&view=`;
  kakoA.target = "_blank"
  kakoA.innerText = '過去の観測データ';
  kakoA.classList.add('kako');
  let td_subtitle = document.getElementsByClassName('td_subtitle')[0];
  td_subtitle.appendChild(kakoA);

  // 整形
  td_subtitle.children[0].insertAdjacentElement(
    "afterbegin", document.createElement('br'));
}

window.onload = function () {
  showGraph();
  showLinkPast();
};