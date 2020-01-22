import echarts from "echarts";
import bmap from "echarts/extension/bmap/bmap";
console.log(bmap)
import geoCoordMap from './assets/geoCoord.json'
import data from "./assets/provinceInfection.json"

var convertData = function (data) {
    var res = [];
    for (var i = 0; i < data.length; i++) {
        var province = data[i].name.slice(0, 2)
        var geoCoord = geoCoordMap[province];
        if (!geoCoord) {
            province = data[i].name.slice(0, 3)
            geoCoord = geoCoordMap[province];
        }
        if (geoCoord) {
            res.push({
                name: province,
                value: geoCoord.concat(data[i].value)
            });
        }
    }
    return res;
};
console.log(convertData(data));
console.log(convertData(data).sort(function (a, b) {
    return b.value[2] - a.value[2];
}).slice(0, 6));

var myChart = echarts.init(document.getElementById('main'));


var option = {
    title: {
        text: "全国新型肺炎疫情实时动态 - 2020/1/22",
        subtext: "数据来源：维基百科",
        sublink: "https://zh.wikipedia.org/wiki/2019年%EF%BC%8D2020年新型冠狀病毒肺炎事件",
        left: "center"
    },
    tooltip: {
        trigger: 'item',
        showDelay: 0,
        transitionDuration: 0.2,
        formatter: function (params) {
            return params.seriesName + '<br/>' + params.name + ': ' + params.value[2];
        }
    },
    bmap: {
        center: [114.114129, 32.550339],
        zoom: 6,
        roam: true,
        mapStyle: {
            styleJson: [{
                'featureType': 'water',
                'elementType': 'all',
                'stylers': {
                    'color': '#d1d1d1'
                }
            }, {
                'featureType': 'land',
                'elementType': 'all',
                'stylers': {
                    'color': '#f3f3f3'
                }
            }, {
                'featureType': 'railway',
                'elementType': 'all',
                'stylers': {
                    'visibility': 'off'
                }
            }, {
                'featureType': 'highway',
                'elementType': 'all',
                'stylers': {
                    'color': '#fdfdfd'
                }
            }, {
                'featureType': 'highway',
                'elementType': 'labels',
                'stylers': {
                    'visibility': 'off'
                }
            }, {
                'featureType': 'arterial',
                'elementType': 'geometry',
                'stylers': {
                    'color': '#fefefe'
                }
            }, {
                'featureType': 'arterial',
                'elementType': 'geometry.fill',
                'stylers': {
                    'color': '#fefefe'
                }
            }, {
                'featureType': 'poi',
                'elementType': 'all',
                'stylers': {
                    'visibility': 'off'
                }
            }, {
                'featureType': 'green',
                'elementType': 'all',
                'stylers': {
                    'visibility': 'off'
                }
            }, {
                'featureType': 'subway',
                'elementType': 'all',
                'stylers': {
                    'visibility': 'off'
                }
            }, {
                'featureType': 'manmade',
                'elementType': 'all',
                'stylers': {
                    'color': '#d1d1d1'
                }
            }, {
                'featureType': 'local',
                'elementType': 'all',
                'stylers': {
                    'color': '#d1d1d1'
                }
            }, {
                'featureType': 'arterial',
                'elementType': 'labels',
                'stylers': {
                    'visibility': 'off'
                }
            }, {
                'featureType': 'boundary',
                'elementType': 'all',
                'stylers': {
                    'color': '#fefefe'
                }
            }, {
                'featureType': 'building',
                'elementType': 'all',
                'stylers': {
                    'color': '#d1d1d1'
                }
            }, {
                'featureType': 'label',
                'elementType': 'labels.text.fill',
                'stylers': {
                    'color': '#999999'
                }
            }]
        }
    },
    toolbox: {
        show: true,
        //orient: 'vertical',
        left: 'left',
        top: 'top',
        feature: {
            dataView: {
                readOnly: false
            },
            restore: {},
            saveAsImage: {}
        }
    },
    series: [{
            name: '确诊人数',
            type: 'scatter',
            coordinateSystem: 'bmap',
            data: convertData(data),
            symbolSize: function (val) {
                return 30 * Math.log10(val[2] + 1);
            },
            label: {
                formatter: '{b}',
                position: 'right',
                show: false
            },
            itemStyle: {
                color: 'purple'
            },
            emphasis: {
                label: {
                    show: true
                }
            }
        },
        {
            name: 'Top 5',
            type: 'effectScatter',
            coordinateSystem: 'bmap',
            data: convertData(data).sort(function (a, b) {
                return b.value[2] - a.value[2];
            }).slice(0, 6),
            symbolSize: function (val) {
                return 30 * Math.log10(val[2] + 1);
            },
            showEffectOn: 'render',
            rippleEffect: {
                brushType: 'stroke'
            },
            hoverAnimation: true,
            label: {
                formatter: '{b}',
                position: 'right',
                show: true
            },
            itemStyle: {
                color: 'purple',
                shadowBlur: 10,
                shadowColor: '#333'
            },
            zlevel: 1
        }
    ]
};

// console.log(myChart)
myChart.setOption(option);