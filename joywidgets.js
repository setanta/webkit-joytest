if (!String.prototype.capitalize) {
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    }
}

function Axis(parentNode, radius)
{
    if (!radius)
        radius = 50;
    this.canvas = document.createElement('canvas');
    this.radius = radius;
    this.innerRadius = radius / 2;
    this.x = 0;
    this.y = 0;
    this.canvas.width = this.radius * 2;
    this.canvas.height = this.canvas.width
    ﻿if (parentNode)
        parentNode.appendChild(this.canvas);
}

Axis.prototype.draw = function()
{
    var context = this.canvas.getContext('2d');

    // Clears the entire canvas.
    this.canvas.width = this.canvas.width;

    context.beginPath();
    context.arc(this.radius, this.radius, this.radius * 0.8,
                0, Math.PI * 2, true);
    context.moveTo(0, this.radius);
    context.lineTo(this.canvas.width, this.radius);
    context.moveTo(this.radius, 0);
    context.lineTo(this.radius, this.canvas.height);
    context.lineWidth = 2;
    context.strokeStyle = 'lightgray';
    context.stroke();

    context.beginPath();
    context.arc(this.radius + this.x, this.radius + this.y, this.innerRadius,
                0, Math.PI * 2, true);
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.closePath();
    context.fill();
}


function Button(label, parentNode)
{
    this.span = document.createElement('span');
    this.span.setAttribute('class', 'button');
    this.span.appendChild(document.createTextNode(label));
    this.setPressed(false);
    if (parentNode)
        parentNode.appendChild(this.span);
}

Button.prototype.setPressed = function(pressed)
{
    this.span.style.backgroundColor = pressed ? '#bbb' : '#fff';
}


function Gamepad(gamepad, parentNode)
{
    this.index = gamepad.index;
    this.type = gamepad.axes.length;

    function createSection(title, subsection, parentNode) {
        var section = document.createElement('section');
        parentNode.appendChild(section);
        if (subsection)
            section.setAttribute('class', 'subsection');
        if (title) {
            var header = document.createElement('header');
            if (!subsection)
                header.setAttribute('class', 'root');
            var h = document.createElement('h1');
            h.appendChild(document.createTextNode(title));
            header.appendChild(h);
            section.appendChild(header);
        }
        return section;
    }

    this.rootNode = createSection('Gamepad ' + this.index, false, parentNode);
    this.rootNode.setAttribute('class', 'gamepad');

    // Show raw gamepad data.
    var dataNode = createSection(undefined, true, this.rootNode);

    var list = document.createElement('dl');
    this.gamepadProperties = list;
    list.id = 'Gamepad' + this.index + 'Data';
    var optionalNodeClass = list.id + 'Optional';

    function addGamepadProperty(type, value, optional) {
        var typeNode = document.createElement('dt');
        typeNode.appendChild(document.createTextNode(type.capitalize() + ':'));
        list.appendChild(typeNode);

        var valueNode = document.createElement('dd');
        valueNode.id = list.id + type.capitalize();
        valueNode.appendChild(document.createTextNode(value));
        list.appendChild(valueNode);

        if (optional) {
            typeNode.setAttribute('class', optionalNodeClass);
            valueNode.setAttribute('class', optionalNodeClass);
        }
    }

    gamepad['type'] = Gamepad.JoystickTypes[this.type];
    var props = ['id', 'type', 'timestamp', 'axes', 'buttons'];
    for (var i = 0; i < props.length; ++i)
        addGamepadProperty(props[i], gamepad[props[i]], i > 1);
    delete gamepad['type'];
    dataNode.appendChild(list);

    var typeDataNode = document.getElementById(list.id + 'Type');
    var hideButton = document.createElement('span');
    hideButton.onclick = function(e) {
        var opt = document.getElementsByClassName(optionalNodeClass);
        for (var i = 0; i < opt.length; ++i)
            opt[i].hidden = !opt[i].hidden;
    }
    hideButton.setAttribute('class', 'hideButton');
    typeDataNode.appendChild(hideButton);

    // Show axes.
    var axesNode = createSection('Axes', true, this.rootNode);
    this.axes = [];
    this.numSticks = Math.floor(gamepad.axes.length / 2);
    for (var i = 0; i < this.numSticks; ++i) {
        var axis = new Axis(axesNode);
        this.axes.push(axis);

        axis.hIndex = i * 2;
        axis.vIndex = axis.hIndex + 1;

        // Jump unused axes' array position.
        if ((this.type == Gamepad.Fighterstick ||
             this.type == Gamepad.DualAnalogGeneric) && i > 0) {
            axis.hIndex += 1;
            axis.vIndex += 1;
        }

        // Switched horizontal and vertical axes' array positions.
        if (this.type == Gamepad.DualAnalogGeneric && i == 1) {
            var tmp = axis.hIndex;
            axis.hIndex = axis.vIndex;
            axis.vIndex = tmp;
        }
    }

    // Show buttons.
    var buttonsNode = createSection('Buttons', true, this.rootNode);
    this.buttons = [];
    for (var i = 0; i < gamepad.buttons.length; ++i)
        this.buttons.push(new Button(i, buttonsNode));

    this.update(gamepad);
}

// The joystick type is determined by its axes count.
// See: https://github.com/Grumbel/jstest-gtk/blob/master/src/joystick_test_widget.cpp
Gamepad.Simplestick = 2;
Gamepad.Fighterstick = 5;
Gamepad.Flightstick = 6;
Gamepad.DualAnalogGeneric = 7;
Gamepad.DualAnalogWithTrigger = 8;
Gamepad.PS3Controller = 28;
Gamepad.JoystickTypes = {
    2  : 'Simple stick',
    5  : 'Fighterstick',
    6  : 'Flightstick',
    7  : 'Dual Analog Gamepad DragonRise Inc. Generic USB Joystick',
    8  : 'Dual Analog Gamepad + Analog Trigger',
    28 : 'Playstation 3 Controller'
}

Gamepad.prototype.update = function(gamepad)
{
    if (gamepad.index != this.index) {
        console.log('Gamepad object updated with wrong gamepad data.');
        return;
    }

    // Update buttons.
    for (var i = 0; i < gamepad.buttons.length; ++i)
        this.buttons[i].setPressed(gamepad.buttons[i]);

    // Update axes.
    for (var i = 0; i < this.numSticks; ++i) {
        var axis = this.axes[i];
        axis.x = gamepad.axes[axis.hIndex] * axis.innerRadius
        axis.y = gamepad.axes[axis.vIndex] * axis.innerRadius
        axis.draw();
    }

    // Update data.
    var properties = ['timestamp', 'axes', 'buttons'];
    for (var i = 0; i < properties.length; ++i) {
        var prop = properties[i];
        var propId = this.gamepadProperties.id + prop.capitalize();
        var dataNode = document.getElementById(propId);
        dataNode.innerHTML = gamepad[prop];
    }
}

Gamepad.prototype.clear = function()
{
    while (this.rootNode.hasChildNodes())
        this.rootNode.removeChild(this.rootNode.lastChild);
    this.rootNode.parentElement.removeChild(this.rootNode);
}

