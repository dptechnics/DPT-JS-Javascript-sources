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
 * The I2C prototype class used to connect as a master
 * to I2C devices.
 * @param {int} sda the GPIO pin to put the SDA signal on. 
 * @param {int} scl the GPIO pin to put the SCL signal on. 
 * @returns {I2C} the I2C object. 
 */
function I2C(sda, scl) {
    this.i2c_sda = sda;
    this.i2c_scl = scl;
    
    /* The I2C device file descriptor */
    var fd = -1;
    
    /**
     * Open the I2C device ready to read and write. 
     */
    this.begin = function () {
        var device = I2CModule.enable_device(this.i2c_sda, this.i2c_scl);
        fd = I2CModule.open_bus(device);
    };
    
    /**
     * Set the address of the slave device you want
     * to control. 
     * @param {int} address the slave address of the device you
     * want to control. 
     */
    this.setSlaveAddress = function(address) {
        I2CModule.set_device(fd, address);
    };
    
    /**
     * Write a byte of data to the selected slave. 
     * @param {int} byte the byte to write to the slave device.
     */
    this.writeByte = function(byte) {
        I2CModule.write_byte(fd, byte);
    };
}