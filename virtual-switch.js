
// var lightsSwitchProvider = require("lights-switch");

// var lightsSwitch = lightsSwitchProvider.create("Test");

// log(lightsSwitch.deviceTitle);
// Конструкторы данных
function ControllData(id, title) {
    return {
      id: id,
      title: title
    };
  };
  
  function DeviceData(deviceId, controllDataArray) {
  
    // Public Section
    var deviceData = {
  
      // Public Methods
      
      // Создать виртуальный дублер физического устройства.
      createVirtualDevice: createVirtualDevice,
      // Активировать слушателей виртуального девайса
      startObserveVirtualDevice: startObserveVirtualDevice,
      // Остановить слушателей виртуального девайса
      stopObserveVirtualDevice: stopObserveVirtualDevice,
      // Активировать слушателей реального девайса
      startObserveRealDevice: startObserveRealDevice,
      // Остановить слушателей реального девайса
      stopObserveRealDevice: stopObserveRealDevice
    };
  
    // Private property
    // Окончание для физического устройства
    var realEnding = "_real";
    // Окончание для виртуального дублера
    var virtualEnding = "_virtual";
    // Идентификатор виртуального устройства 
    var virtualDeviceId = deviceId + virtualEnding
    // Идентификатор реального устройства
    var realDeviceId = deviceId + realEnding
    // Слушатели изменения состояний виртуального устройства
    var virtualDeviceObservers = new Array();
    // Слушатели изменения состояний реального устройства
    var realDeviceObservers = new Array();
    // Контроллы устройства, которые будут синхронизироваться
    var controllDataArray = controllDataArray
  
    // Private methods
    // Создать виртуальный дублер физического устройства.
    function createVirtualDevice() {
      var cells = {};
      controllDataArray.forEach(function(controllData) {
        var path = realDeviceId + "/" + controllData.id
        var realValue = dev[path]
        var realBoolValue = (realValue === "ON");
        cells[controllData.id] = {
          title: controllData.title,
          type: "switch",
          value: realBoolValue,
          readonly: false,
          forceDefault: true,
        };
      });
      
      defineVirtualDevice(virtualDeviceId, {
        cells: cells
      });
    };
  
    // Активировать слушателей виртуального девайса
    function startObserveVirtualDevice() {
      this.stopObserveVirtualDevice()
      if (virtualDeviceObservers.length === 0) {
        controllDataArray.forEach(function(controllData) {
          var controllRule = createObserveVirtualDeviceRule(controllData.id);
          virtualDeviceObservers.push(controllRule)
        });
      };
      virtualDeviceObservers.forEach(function(rule) {
        enableRule(rule)
      });
    };
  
    // Остановить слушателей виртуального девайса
    function stopObserveVirtualDevice() {
      virtualDeviceObservers.forEach(function(rule) {
        disableRule(rule);
      });
    };
  
    // Активировать слушателей реального девайса
    function startObserveRealDevice() {
      this.stopObserveRealDevice()
      if (realDeviceObservers.length === 0) {
        createObserveRealDeviceRule
        controllDataArray.forEach(function(controllData) {
          var controllRule = createObserveRealDeviceRule(controllData.id);
          realDeviceObservers.push(controllRule)
        });
      };
      realDeviceObservers.forEach(function(rule) {
        enableRule(rule)
      });
    };
  
    // Остановить слушателей реального девайса
    function stopObserveRealDevice() {
      realDeviceObservers.forEach(function(rule) {
        disableRule(rule);
      });
    };
  
    
    // Создание правила проброса события с виртуального устройства на реальное
    function createObserveVirtualDeviceRule(controllId) {
      var changedId = virtualDeviceId + "/" + controllId
      var ruleId = virtualDeviceId + "/" + controllId + "_to_" + realDeviceId + "/" + controllId
      var rule = defineRule( ruleId, {
        whenChanged: changedId,
        then: function(newVal) {
          var valueStr = newVal ? "ON" : "OFF"
          var path = realDeviceId + "/" + controllId
          if (dev[path] !== valueStr) {
            // 1. Создаем пустой объект
            var payload = {};
            // 2. Динамически добавляем свойство
            payload[controllId] = valueStr;
            // 3. Сериализуем в JSON
            var jsonString = JSON.stringify(payload); // → {"switch1":"ON/OFF"}
            // log.debug("Отправляем событие: " + realDeviceId + " " + jsonString)
            publish("zigbee2mqtt/" + realDeviceId + "/set", jsonString, 2, false);
          }
        }
      });
      disableRule(rule);
      return rule
    };
  
    // Создание правила проброса события с реального устройства на виртуальное
    function createObserveRealDeviceRule(controllId) {
      var changedId = realDeviceId + "/" + controllId
      var ruleId = realDeviceId + "/" + controllId + "_to_" + virtualDeviceId + "/" + controllId
      var rule = defineRule( ruleId, {
        whenChanged: changedId,  
        then: function(newVal) {
          var boolValue = (newVal === "ON");
          var path = virtualDeviceId + "/" + controllId
          if (dev[path] !== boolValue) {
            // log("Изменяем значение выключателя ")
            dev[path] = boolValue
          }
        }
      });
      disableRule(rule);
      return rule
    };
    
    return deviceData
  };
  
  ///////////////////////////
  
  
  var deviceData = [
    DeviceData(
      "double_switch_living_room", 
      [
        ControllData("state_l1", "Свет в зале"),
        ControllData("state_l2", "Свет в прихожей")
      ]
    ),
  
    DeviceData(
      "double_switch_bedroom", 
      [
        ControllData("state_l1", "Свет в спальне"),
        ControllData("state_l2", "Свет в прихожей")
      ]
    ),
  ]
  
  deviceData.forEach(function(device) {
    device.createVirtualDevice()
    device.startObserveVirtualDevice()
    device.startObserveRealDevice()
  });