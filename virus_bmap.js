import echarts from "echarts";
import "echarts/extension/bmap/bmap";
import geoCoordMap from './assets/geoCoordCity.json'
// import geoCoordMap from './assets/geoCoord.json'
import geoJson from './assets/map.geo.json'


const url = "https://virus-spider.now.sh/api";
var geoChart = echarts.init(document.getElementById('main'));
var lineAccChart = echarts.init(document.getElementById('lineAcc'));
var lineChart = echarts.init(document.getElementById('line'));
echarts.registerMap('CN', geoJson);
// var data;
// const request = async () => {
//     const response = await fetch(url);
//     data = await response.json();
// }
// request()

fetch(url)
    .then((response) => {
        response.json()
            .then((myJson) => {
                console.log("myJson", myJson);
                window.myJson = myJson;
                var data = myJson;
                data.省级.累计 = data.省级.累计.sort(function (a, b) {
                    return b.value[0] - a.value[0];
                });
                let shader_data = getShadedData(data.省级.累计);
                let geoOption = getOption(data),
                    [lineAccOption, lineOption] = getLineOption(data.每日);
                geoChart.setOption(geoOption);
                lineAccChart.setOption(lineAccOption);
                lineChart.setOption(lineOption);
                var bmap = geoChart.getModel().getComponent('bmap').getBMap();
                bmapAddControl(bmap);
                addShader(shader_data, bmap);
                // Create GeoCoordinate Instance
                // var myGeo = new BMap.Geocoder();
            })
    });

// data = await (await fetch(url)).json();
// console.log("data", data);

function convertData(data) {
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
}

function bmapAddControl(bmap) {
    bmap.addControl(new BMap.NavigationControl());
    bmap.addControl(new BMap.ScaleControl());
    bmap.addControl(new BMap.MapTypeControl());
    bmap.addControl(new BMap.CopyrightControl());
    bmap.addControl(new BMap.GeolocationControl());
}

function getShadedData(data) {
    // ['#FFFFFF', '#FFF6CE', '#FFD20A', '#EA3300', '#8B0000']
    console.log(data)
    let res = new Array();
    let N = data.length;
    let Q = N / 4;
    let color;
    for (let i = 0; i < N; i++) {
        if (i < Q) {
            color = '#8B0000';
        } else if (i < 2 * Q) {
            color = '#EA3300';
        } else if (i < 3 * Q) {
            color = '#FFD20A';
        } else {
            color = (data[i].value === 0) ? '#FFFFFF' : '#FFF6CE'
        }
        res.push([data[i].name, color]);
    }
    return res;
}

function addShader(provList, bmap) {
    function getBoundary(provItem) {
        var bdary = new BMap.Boundary();
        bdary.get(provItem[0], function (rs) { //获取行政区域
            var count = rs.boundaries.length; //行政区域的点有多少个
            if (count === 0) {
                console.log('未能获取当前输入行政区域');
                console.log(provItem[0]);
                return;
            }
            var pointArray = [];
            for (var i = 0; i < count; i++) {
                let ply = new BMap.Polygon(rs.boundaries[i], {
                    strokeWeight: 1,
                    strokeColor: "#aaaaaa",
                    fillColor: provItem[1]
                }); //建立多边形覆盖物
                bmap.addOverlay(ply); //添加覆盖物
                pointArray = pointArray.concat(ply.getPath());
            }
        });
    }

    setTimeout(function () {
        provList.forEach(function (item) {
            getBoundary(item);
        });
    }, 20);
}

function getAccData(data) {
    let res = data.slice(0, 1);
    for (let i = 1; i < data.length; i++) {
        res.push(res[res.length - 1] + data[i]);
    }
    return res;
}

function getOption(data) {
    let convertedData = convertData(data.省级.累计);
    let option = {
        title: {
            text: "全国新型肺炎疫情实时动态",
            subtext: "数据来源：维基百科 | " + new Date().toLocaleString('zh').slice(0, -3),
            sublink: "https://zh.wikipedia.org/wiki/%E6%96%B0%E5%9E%8B%E5%86%A0%E7%8B%80%E7%97%85%E6%AF%92%E8%82%BA%E7%82%8E%E4%B8%AD%E5%9C%8B%E5%A4%A7%E9%99%B8%E7%96%AB%E6%83%85%E7%97%85%E4%BE%8B",
            left: "center"
        },
        tooltip: {
            trigger: 'item',
            showDelay: 0,
            transitionDuration: 0.2,
            formatter: function (params) {
                return params.seriesName + ' - ' + params.name + '<br/>' + '确诊: ' + params.value[2] + '<br/>' + '死亡: ' + params.value[3] + '<br/>' + '治愈: ' + params.value[4];
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
        bmap: {
            center: [114.114129, 32.550339],
            zoom: 5,
            roam: 'move',
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
        series: [{
                name: '疫情影响人数',
                type: 'scatter',
                coordinateSystem: 'bmap',
                data: convertedData,
                symbolSize: function (val) {
                    return 20 * Math.log10(val[2] + 1);
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
                data: convertedData.slice(0, 6),
                symbolSize: function (val) {
                    return 20 * Math.log10(val[2] + 1);
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
    }
    return option;
}

function getLineOption(data) {
    let optionAcc = {
        title: {
            text: "全国疫情累计趋势图",
            left: "center"
        },
        tooltip: {
            trigger: 'axis',
            showDelay: 0,
            transitionDuration: 0.2
        },
        toolbox: {
            show: true,
            //orient: 'vertical',
            right: '3%',
            top: 'top',
            feature: {
                saveAsImage: {}
            }
        },
        legend: {
            data: ['确诊', '死亡', '治愈'],
            orient: 'horizontal',
            left: 'center',
            top: '3%'
        },
        series: [{
                name: '确诊',
                type: 'line',
                data: getAccData(data.确诊)
            },
            {
                name: '死亡',
                type: 'line',
                yAxisIndex: 1,
                data: getAccData(data.死亡)
            },
            {
                name: '治愈',
                type: 'line',
                yAxisIndex: 1,
                data: getAccData(data.治愈)
            }
        ],
        grid: {
            left: '1%',
            right: '3%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.日期
        },
        yAxis: [{
            name: '确诊',
            type: 'value'
        }, {
            name: '死亡/治愈',
            type: 'value',
            splitLine: {show: false},
            max: function (value) {return Math.ceil(value.max / 50) * 100}
        }]
    };
    let option = {
        title: {
            text: "全国疫情新增趋势图",
            left: "center"
        },
        tooltip: {
            trigger: 'axis',
            showDelay: 0,
            transitionDuration: 0.2
        },
        toolbox: {
            show: true,
            //orient: 'vertical',
            right: '3%',
            top: 'top',
            feature: {
                saveAsImage: {}
            }
        },
        legend: {
            data: ['确诊', '死亡', '治愈'],
            orient: 'horizontal',
            left: 'center',
            top: '3%'
        },
        series: [{
                name: '确诊',
                type: 'line',
                data: data.确诊
            },
            {
                name: '死亡',
                type: 'line',
                yAxisIndex: 1,
                data: data.死亡
            },
            {
                name: '治愈',
                type: 'line',
                yAxisIndex: 1,
                data: data.治愈
            }
        ],
        grid: {
            left: '1%',
            right: '3%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.日期
        },
        yAxis: [{
            name: '确诊',
            type: 'value'
        }, {
            name: '死亡/治愈',
            type: 'value',
            splitLine: {show: false},
            max: function (value) {return Math.ceil(value.max / 60) * 100}
        }]
    };
    return [optionAcc, option];
}
// console.log(myChart)
// var option = getOption(data)
// myChart.setOption(option);