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

/**
 * The Serial prototype class used to connect to serial
 * devices. 
 * @returns {Serial} the Serial object.
 */
function Serial() {
    
    /* The serial device file descriptor */
    var fd = -1;
    
    /* The handler called when bytes are received */
    var rHandler = null;
    
    /**
     * Sets the data rate in bits per second (baud) for serial data transmission. 
     * @param {int} speed the baudrate you want to use. 
     * @param {function} callback function called when serial port is setup. Accepts
     * one boolean argument representing the result of the operation. 
     */
    this.begin = function (speed, callback) {
        if(SerialModule.set_speed(speed)) {
            uv.fs_open("/dev/ttyATH0", "+", 777, function(file_desc) {
                fd = file_desc;
                
                // Open the file as a pipe for reading
                var pipe = uv.new_pipe(false);
                uv.pipe_open(pipe, fd);
                
                // Start reading
                uv.read_start(pipe, function(err, chunk) {
                    if(typeof(rHandler) === "function"){
                        var decbyte = 0;
                        if(err === null) {
                            // TODO: more efficient decoding
                            decbyte = parseInt(Duktape.enc('hex', chunk), 16);
                        }
                        rHandler(err, decbyte);
                    }
                });
                
                callback(true);
            });
        } else {
            callback(false);
        }
    };
    
    /**
     * Install a readhandler on the serial port which will be called
     * when the port receives data or when there is an error. 
     * @param {function} readHandler handler which is called when the serial port
     * receives a new byte. This function takes two arguments:
     *  - err: null if read succeeded, error otherways
     *  - byte: the received byte as a decimal integer.
     */
    this.onReceive = function(readHandler) {
        rHandler = readHandler;
    };
    
    /**
     * Write a byte to the serial port. 
     * @param {int} byte the byte to write as a decimal integer. 
     */
    this.writeByte = function(byte) {
        var buf = Duktape.Buffer(1);
        buf[0] = byte;
        uv.fs_write(fd, buf, -1);
    };
    
    /**
     * Write a string to the serial port. 
     * @param {string} string the string to write to the serial port.
     */
    this.writeString = function(string) {
        uv.fs_write(fd, string, -1);
    };
}