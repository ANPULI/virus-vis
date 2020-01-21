import echarts from "echarts";
import mapJson from './assets/map.geo.json'
import provinceInfection from "./assets/provinceInfection.json"
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
        res.push({
            name: data[i].name,
            value: data[i].value.reduce((a, b) => a + b, 0)
        });
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
        max: 300,
        text: ['High', 'Low'],
        left: 'right',
        realtime: true,
        calculable: true,
        inRange: {
            color: ['#FFFFFF', '#0000FF', '#FFFF00', '#FFA500', '#FF0000']
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
        name: '影响人数',
        type: 'map',
        mapType: 'MY',
        roam: true,
        data: convertData(provinceInfection),
        aspectScale: 0.85, //地图长度比
        label: {
            normal: {
                show: true,
                textStyle: {
                    color: '#000'
                }
            },
            emphasis: {
                show: false,
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