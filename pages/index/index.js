const weatherMap = {
    'sunny': '晴天',
    'cloudy': '多云',
    'overcast': '阴',
    'lightrain': '小雨',
    'heavyrain': '大雨',
    'snow': '雪'
}

const weatherColorMap = {
    'sunny': '#cbeefd',
    'cloudy': '#deeef6',
    'overcast': '#c6ced2',
    'lightrain': '#bdd5e1',
    'heavyrain': '#c5ccd0',
    'snow': '#aae1fc'
}

var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
var qqmapsdk;
const UNPROMPTED = 0
const UNAUTHORIZED = 1
const AUTHORIZED = 2
Page({
    data: {
        nowTemp:14,
        nowWeather: "多云",
        nowWeatherBackground: "",
        forecast: [], 
        todayDate: "",
        todayTemp: "",
        city: "太原市",
        locationAuthType: UNPROMPTED,
    },
    onPullDownRefresh(){
        this.getNow(() => wx.stopPullDownRefresh()
        );
    },
    onLoad() {
        console.log("onLoad");
        this.getNow();
        qqmapsdk = new QQMapWX({
            key: '5LSBZ-D7OHF-NX4J6-JZPXR-PKW6F-OTBC5'
        });
        wx.getSetting({
            success: res => {
                let auth = res.authSetting['scope.userLocation']
                let locationAuthType = auth ? AUTHORIZED
                    : (auth === false) ? UNAUTHORIZED : UNPROMPTED
                this.setData({
                    locationAuthType: locationAuthType
                })
                if (auth)
                    this.getCityAndWeather()
                else
                    this.getNow()
            },
            fail: () => {
                this.getNow()
            }
        })
    },
    getNow(callback){
        wx.request({
            url: 'https://test-miniprogram.com/api/weather/now',
            data: {
                city: this.data.city
            },
            success: res => {
                // console.log(res);
                let result = res.data.result;
                this.setNow(result);
                this.setHourlyWeather(result);
                this.setToday(result);
            },
            complete: () =>{
                callback && callback()
            }
        })
    },
    setNow(result){
        let temp = result.now.temp;
        let weather = result.now.weather
        this.setData({
            nowTemp: temp,
            nowWeather: weatherMap[weather],
            nowWeatherBackground: '/images/' + weather + '-bg.png',
        });
        wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: weatherColorMap[weather],
        });
    },
    setHourlyWeather(result){
        let forecastMsg = result.forecast
        let nowHour = new Date().getHours(); let forecast = [];
        forecastMsg.forEach(function (value) {
            forecast.push({
                time: (value.id * 3 + nowHour) % 24 + '时',
                iconPath: '/images/' + value.weather + '-icon.png',
                temp: value.temp + '°'
            })
        }); 
        forecast[0].time = '现在'
        this.setData({
            forecast: forecast
        });
    },
    setToday(result){
        let minTemp = result.today.minTemp;
        let maxTemp = result.today.maxTemp;
        let date = new Date()
        this.setData({
            todayTemp: minTemp + '° - ' + maxTemp +'°',
            todayDate: date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + ' 今天'
        })
    },
    onTapDayWeather(){
        wx.navigateTo({
            url: '/pages/list/list?city='+this.data.city,
        })
    },
    onTapLocation(){
        if(this.data.locationAuthType == UNAUTHORIZED){
            wx.openSetting({
                success: res =>{
                    let locationAuth = res.authSetting['scope.userLocation']
                    if (locationAuth){
                        this.getCityAndWeather();
                    }
                }
            });
        }
        else{
            this.getCityAndWeather();
        }
    },
    getCityAndWeather(){
        wx.getLocation({
            success: res => {
                qqmapsdk.reverseGeocoder({
                    location: {
                        latitude: res.latitude,
                        longitude: res.longitude
                    },
                    success: res => {
                        let city = res.result.address_component.city;
                        this.setData({
                            city: city,
                            locationAuthType: AUTHORIZED
                        })
                        this.getNow()
                    }
                });
            },
            fail: () =>{
                this.setData({
                    locationAuthType: UNAUTHORIZED,
                })
            }
        })
    }
})