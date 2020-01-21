import echarts from "echarts";
import mapJson from './assets/map.geo.json'
import provinceDefault from "./assets/provinceDefault.json"
// window.map = mapJson
// window.pd = provinceDefault
// console.log(mapJson)
// console.log(echarts)
// console.log(provinceDefault)

// window.onload = () => {
//     document.getElementById('main').style('width')
// }

// window.onresize = () => {
//     document.getElementById('main').style.width = '100%';
//     document.getElementById('main').style.height = '100%';

// }

// fetch(new Request('./map.geo.json')).then((it) => {
//     it.json().then((it) => {
//         console.log(it)
//     })
// })

var convertData = function (data) {
    var res = [];
    for (var i = 0; i < data.length; i++) {
        var geoCoord = mapJson[data[i].name];
        if (geoCoord) {
            res.push({
                name: data[i].name,
                value: geoCoord.concat(data[i].value)
            });
        }
    }
    return res;
};



// 基于准备好的dom，初始化echarts实例
var myChart = echarts.init(document.getElementById('main'));

echarts.registerMap('MY', mapJson) //注册

// echarts.registerMap('xicheng', geoJson, {});
var option = {
    title :{
        text: "全国新型肺炎疫情实时动态",
        subtext: "数据来源：丁香医生",
        left: "center"
    },
    tooltip: {
        trigger: 'item',
        showDelay: 0,
        transitionDuration: 0.2,
        formatter: function (params) {
            var value = (params.value + '').split('.');
            value = value[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,');
            return params.seriesName + '<br/>' + params.name + ': ' + value;
        }
    },
    visualMap: {
        min: 0,
        max: 100000,
        text: ['High', 'Low'],
        left: 'right',
        realtime: false,
        calculable: true,
        inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        }
    },
    toolbox: {
        show: true,
        //orient: 'vertical',
        left: 'left',
        top: 'top',
        feature: {
            dataView: {readOnly: false},
            restore: {},
            saveAsImage: {}
        }
    },
    series: [
        {
        name: '疫情人数',
        type: 'map',
        mapType: 'MY',
        roam: true,
        data: provinceDefault,
        aspectScale: 0.85, //地图长度比
        label: {
            normal: {
                show: false,
                textStyle: {
                    color: '#000'
                }
            },
            emphasis: {
                show: true,
                textStyle: {
                    color: '#333'
                }
            }
        },
        
    }]
};

// console.log(myChart)
myChart.setOption(option);

// var option = {
//     series: [{
//         name: 'my custom map',
//         type: 'map',
//         roam: true,
//         map: 'MY' //使用
//     }]
// };

// myChart.setOption(option);