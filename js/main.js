/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

//缝合怪
	 var videoPlay = document.getElementById('video');
	 var videoPlay_Continue = document.getElementById('videoPlay_Continue');
	 var filereader = new FileReader();
	 var timecell = 1000;//Recorder的start间隔为1秒
	 var mediaRecorder;
	 
	 var mimeType_for_test = 'video/webm;codecs=opus,vp8';
	 
//使用MediaSource播放blob
	 var mediasource = new MediaSource;
	 var sourcebuffer;
	 //var arr = [];
	  mediasource.addEventListener('error',function(e){
		console.log('error at mediasource:'+e);
	  });
	  
	  videoPlay_Continue.src = URL.createObjectURL(mediasource);
	  

	  mediasource.addEventListener('sourceopen',function(e){
		sourcebuffer = mediasource.addSourceBuffer(mimeType_for_test);
		sourcebuffer.mode = 'sequence';//不然需要添加时间戳
		sourcebuffer.onerror = function(error){
			console.log('==============error occured :'+error);
		}
		});



const videoElement = document.querySelector('video');
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const videoSelect = document.querySelector('select#videoSource');
const selectors = [audioInputSelect, audioOutputSelect, videoSelect];

audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== 'undefined') {
    element.setSinkId(sinkId)
        .then(() => {
          console.log(`Success, audio output device attached: ${sinkId}`);
        })
        .catch(error => {
          let errorMessage = error;
          if (error.name === 'SecurityError') {
            errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
          }
          console.error(errorMessage);
          // Jump back to first output device in the list as it's the default.
          audioOutputSelect.selectedIndex = 0;
        });
  } else {
    console.warn('Browser does not support output device selection.');
  }
}

function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  attachSinkId(videoElement, audioDestination);
}

function gotStream(stream) {
	stream.onactive = function(e){
		//mediaRecorder.start(timecell);
		console.log('stream active');
	}
	
  window.stream = stream; // make stream available to console
  videoElement.srcObject = stream;
  // Refresh button list in case labels have become available
  
  //缝合怪又来咯
  //初始化MediaRecord
		var record_options = {
			audioBitsPerSecond:128000,
			videoBitsPerSecond:2500000,
			//mimeType : 'video/webm'
			mimeType : mimeType_for_test
		}
		//创建MediaRecorder
		mediaRecorder = new MediaRecorder(stream,record_options);
		//console.log(mediaRecorder);
		//当数据可用
		mediaRecorder.ondataavailable = function(e) {
			//console.log(e.data);
			if(e.data.size>0){		
				var reader = new FileReader();
				var arr = [];
				arr.push(e.data);
				var blob = new Blob(arr,{'type':mimeType_for_test});
				reader.readAsArrayBuffer(e.data);
				
				reader.onloadend = function(e){
					sourcebuffer.appendBuffer(reader.result);
					sourcebuffer.addEventListener('updateend',function(){
					});
				}
			}
		}
	
	//mediaRecorder.start(timecell);
	mediaRecorder.onstart = function(e) {
	  console.log('Record onstart');
    }
    mediaRecorder.onstop = function(e) {
	  console.log('Record onstop');
    }
	//缝合怪的尾巴

  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}
function tryRestartRecorder(){
	if(mediaRecorder.stream.active){
		console.log('active');
		try{
			mediaRecorder.start(timecell);
		}catch(e){
			console.log('Error when try to restart mediaRecorder');
			console.log(e);
			console.log(mediaRecorder);
		}
	}else{
		console.log('not active');
		setTimeout(tryRestartRecorder,100);
	}
	
	
}
function test(){
	
	try{
		mediaRecorder.stop();
	}catch(e){}
	
	start();
	console.log('stream has been changed');
	
	setTimeout(tryRestartRecorder(),100);

	
}
function init(){
	start();
	//绑定按钮
	//按钮的触发
	var record = document.getElementById('record');
	var stop = document.getElementById('stop');
	var printstate = document.getElementById('printstate');
	//录制按钮
	
    record.onclick = function() {
		//检查是否已经开始录制
	  if(mediaRecorder.state=='recording'){
		console.log('still recording! no way');
		return;
	  }
      mediaRecorder.start(timecell);//可以在参数中设置切片时间
	  console.log('mediaRecorder state:');
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";
      record.style.color = "black";
    }
	
	//停止录制按钮
    stop.onclick = function() {
		//检查是否已经停止录制
	  if(mediaRecorder.state=='inactive'){
		console.log('already stop! no way');
		return;
	  }
      mediaRecorder.stop();
	  
      record.style.background = "";
      record.style.color = "";
    }
	
	//在控制台打印当前MediaRecorder的状态
	printstate.onclick = function() {
		try{
			console.log('mediaRecorder  state:');
			console.log(mediaRecorder);
			console.log('sourcebuffer  state:');
			console.log(sourcebuffer);
			console.log('mediasource  state:');
			console.log(mediasource);
			
		}catch(e){
			console.log('error at printstate.onclick');
		}
	}
}



audioInputSelect.onchange = test;
audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = test;

init();