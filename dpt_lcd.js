/* 
 * Copyright (c) 2015, Daan Pape
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 * 
 *     1. Redistributions of source code must retain the above copyright 
 *        notice, this list of conditions and the following disclaimer.
 *
 *     2. Redistributions in binary form must reproduce the above copyright 
 *        notice, this list of conditions and the following disclaimer in the 
 *        documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * The I2CLCD prototype class to control a standard PCF8574
 * I2C LCD. 
 * @param {I2C} i2c the I2C object with the LCD address already set. 
 * @param {int} cols the number of columns on the screen. 
 * @param {int} rows the number of rows on the screen. 
 * @returns {I2CLCD} the I2CLCD object. 
 */
function I2CLCD(i2c, cols, rows) {
    /* Constants */
    var PCF8574_RS = 0x01;
    var PCF8574_EN = 0x04;
    var PCF8574_BL = 0x08;

    var CMD_CLEAR = 0x01;
    var CMD_OFF = 0x08;
    var CMD_ON_NO_CURSOR = 0x0C;
    var CMD_ON_BLINK_CURSOR = 0x0F;
    var CMD_ON_SOLID_CURSOR = 0x0E;

    var CMD_SHIFT_LEFT = 0x18;
    var CMD_SHIFT_RIGHT = 0x1C;

    var CMD_FIRST_LINE = 0x80;
    var CMD_SECOND_LINE = 0xC0;
    var CMD_THIRD_LINE = 0x94;
    var CMD_FOURTH_LINE = 0xD4;

    var CMD_LINE_OFFSETS = [CMD_FIRST_LINE, CMD_SECOND_LINE, CMD_THIRD_LINE, CMD_FOURTH_LINE];
    
    /* Public prototype variables */
    this.n_cols = cols;
    this.n_rows = rows;
    
    /* Private variables */
    var i2cdev = i2c;
    var lcdBacklight = PCF8574_BL;
    var lcdCursor = CMD_ON_NO_CURSOR;
    var lcdOn = true;
    
    /* The type of LCD commands */
    var CommandType = {DATA: 0, COMMAND: 1};

    /**
     * Write data to the LCD screen. 
     * @param {uint8} data the data to write to the LCD. 
     * @param {CommandType} type the type of data to write to the LCD. 
     * @param {function} callback the callback function when writing is complete.
     */
    var _lcd_write = function (data, type, callback) {
        var low_bits = (data & 0x0f) << 4;
        var high_bits = data & 0xf0;

        var control = lcdBacklight;
        var delay = 0;
        if (type === CommandType.DATA) {
            control = control | PCF8574_RS;
            delay = 1;  /* Wait 1 ms for data writes */
        } else {
            delay = 5;  /* Wait 5 ms for command execution */
        }

        /* Send higher part of the byte */
        i2cdev.writeByte(high_bits | control);
        setTimeout(function () {
            i2cdev.writeByte(high_bits | control | PCF8574_EN);
            setTimeout(function () {
                i2cdev.writeByte(high_bits | control);
                setTimeout(function () {
                    /* Send lower part of the byte */
                    i2cdev.writeByte(low_bits | control);
                    setTimeout(function () {
                        i2cdev.writeByte(low_bits | control | PCF8574_EN);
                        setTimeout(function () {
                            i2cdev.writeByte(low_bits | control);
                            setTimeout(function () {
                                if(typeof(callback) === "function") {
                                    callback();
                                }
                            }, delay);
                        }, 1);
                    }, 1);
                }, delay);
            }, 1);
        }, 1);
    };

    /**
     * Initialize the LCD screen.
     * @param {function} callback the callback function when the LCD is initialized. 
     */
    this.begin = function (callback) {
        /* Initialize the LCD display to use 4-bit mode */
        i2cdev.writeByte(0x30);
        i2cdev.writeByte(0x30 | PCF8574_EN);
        setTimeout(function () {
            i2cdev.writeByte(0x30);
            i2cdev.writeByte(0x30 | PCF8574_EN);
            setTimeout(function () {
                i2cdev.writeByte(0x30);
                i2cdev.writeByte(0x30 | PCF8574_EN);
                setTimeout(function () {
                    i2cdev.writeByte(0x20);
                    i2cdev.writeByte(0x20 | PCF8574_EN);
                    setTimeout(function () {
                        /* 4-bit 2-line */
                        _lcd_write(0x28, CommandType.COMMAND, function () {
                            /* Clear display and put cursor at home position */
                            _lcd_write(0x01, CommandType.COMMAND, function () {
                                /* Turn on display and hide cursor */
                                _lcd_write(0x0C, CommandType.COMMAND, callback);
                            });
                        });
                    }, 5);
                }, 1);
            }, 1);
        }, 5);
    };

    /**
     * Clears the LCD screen and positions the cursor in the upper-left corner.
     * @param {function} callback the callback function when the operation is done.
     */
    this.clear = function (callback) {
        _lcd_write(CMD_CLEAR, CommandType.COMMAND, callback);
    };

    /**
     * Positions the cursor in the upper-left corner of the LCD.
     * @param {function} callback the callback function when the operation is done.
     */
    this.home = function (callback) {
        this.setCursor(0, 0, callback);
    };

    /**
     * Set the location of the cursor to a specific position. 
     * @param {int} col the column at which to position the cursor with 0 being the first column.
     * @param {int} row the row at which to position the cursor with 0 being the first row.
     * @param {function} callback the callback function when the operation is done.  
     */
    this.setCursor = function (col, row, callback) {
        var r = row % this.n_rows;
        var c = col % this.n_cols;

        _lcd_write(CMD_LINE_OFFSETS[r] + c, CommandType.COMMAND, callback);
    };

    /**
     * Helper function to print text to the LCD. 
     * @param {string} text the to print. 
     * @param {int} pos the current position in the string. 
     * @param {function} callback the callback function when the operation is done.
     */
    var _print_helper = function (text, pos, callback) {
        if (text.length > pos) {
            _lcd_write(text[pos].charCodeAt(0), CommandType.DATA, function () {
                _print_helper(text, pos + 1, callback);
            });
        } else {
            /* All text is written */
            if(typeof(callback) === "function") {
                callback();
            }
        }
    };

    /**
     * Prints text to the LCD. 
     * @param {string} text the text to print to the LCD.
     * @param {function} callback the callback function when the operation is done.
     */
    this.print = function (text, callback) {
        _print_helper(text, 0, callback);
    };
    
    /**
     * Turns on the LCD display, after it's been turned off with noDisplay(). This will restore
     * the text (and cursor) that was on the display. 
     * @param {function} callback the callback function when the operation is done.
     */
    this.display = function(callback) {
        lcdOn = true;
        _lcd_write(lcdCursor, CommandType.COMMAND, callback);
    };
    
    /**
     * Turns off the LCD display, without losing the text currently shown on it. 
     * @param {function} callback the callback function when the operation is done.
     */
    this.noDisplay = function(callback) {
        lcdOn = false;
        _lcd_write(CMD_OFF, CommandType.COMMAND, callback);
    };
    
    /**
     * Display the LCD cursor at the position to which the next character will be written.
     * @param {function} callback the callback function when the operation is done.
     */
    this.cursor = function (callback) {
        lcdCursor = CMD_ON_SOLID_CURSOR;
        if(lcdOn) {
            _lcd_write(lcdCursor, CommandType.COMMAND, callback);
        }
    };
    
    /**
     * Hide the LCD cursor. 
     * @param {function} callback the callback function when the operation is done. 
     */
    this.noCursor = function(callback) {
        lcdCursor = CMD_ON_NO_CURSOR;
        if(lcdOn) {
            _lcd_write(lcdCursor, CommandType.COMMAND, callback);
        }
    };
    
    /**
     * Display the blinking LCD cursor. If used in combination with the cursor() function, the result will depend
     * on the particular display. 
     * @param {function} callback the callback function when te operation is done. 
     */
    this.blink = function(callback) {
        lcdCursor = CMD_ON_BLINK_CURSOR;
        if(lcdOn) {
            _lcd_write(lcdCursor, CommandType.COMMAND, callback);
        }
    };
    
    /**
     * Turn on the LCD backlight. 
     * @param {function} callback the callback function when te operation is done. 
     */
    this.backlight = function(callback) {
        lcdBacklight = PCF8574_BL;
        i2cdev.writeByte(lcdBacklight);
        if(typeof(callback) === "function") {
            callback();
        }
    };
    
    /**
     * Turn off the LCD backlight.
     * @param {function} callback the callback function when te operation is done. 
     */
    this.noBacklight = function(callback) {
        lcdBacklight = 0;
        i2cdev.writeByte(lcdBacklight);
        if(typeof(callback) === "function") {
            callback();
        }
    };
    
    /**
     * Shift the screen contents to the right.
     * @param {function} callback the callback function when te operation is done.
     */
    this.shiftRight = function(callback) {
        _lcd_write(CMD_SHIFT_RIGHT, CommandType.COMMAND, callback);
    };
    
    /**
     * Shift the screen contents to the left. 
     * @param {function} callback the callback function when te operation is done.
     */
    this.shiftLeft = function(callback) {
        _lcd_write(CMD_SHIFT_LEFT, CommandType.COMMAND, callback);
    };
};

