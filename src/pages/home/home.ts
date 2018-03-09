import { Component, ViewChild } from '@angular/core';
import { NavController, Platform, Slides } from 'ionic-angular';
import { Device } from '@ionic-native/device';
import { Geolocation } from '@ionic-native/geolocation';
import { DeviceOrientation } from '@ionic-native/device-orientation';
import { $WebSocket } from 'angular2-websocket/angular2-websocket'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  socket = new $WebSocket('wss://make-it-rain-server.herokuapp.com');
  // socket = new $WebSocket('ws://localhost:6969');
  position: any;
  heading: any;
  swipedCount = 0;
  clientsInFOV;

  constructor(public navCtrl: NavController,
    private platform: Platform,
    private device: Device,
    private geolocation: Geolocation,
    private deviceOrientation: DeviceOrientation) {
    platform.ready().then(() => {
      this.socket.send({ type: 'handshake' }).subscribe(
        (message) => {
          console.info(message);
        },
        (error) => {
          console.error('Error:', error);
        },
        () => {
          console.info('Handshake sent');
        }
      );
      this.socket.onMessage(message => {
        const parsedMessage = JSON.parse(message.data);
        if(parsedMessage.type === 'clients') {
          const clientsInFOV = parsedMessage.data;
          console.info('Clients in your field of view:', clientsInFOV.map(client => client.id));
          this.clientsInFOV = clientsInFOV;
        }
      });
      this.initGeolocation();
      this.initDeviceOrientation();
    });
  }

  initGeolocation() {
    this.geolocation.watchPosition().subscribe(
      (position) => {
        if(position.coords) {
          this.position = position.coords;
          this.socket.send({ type: 'position', data: { latitude: position.coords.latitude, longitude: position.coords.longitude } }).subscribe(
            (message) => {
              console.info(message);
            },
            (error) => {
              console.error('Error: Failed to send position', error);
            },
            () => {
              console.info('Position sent');
            }
          );
        }
      },
      (error) => {
        console.error('Error: Failed to get current position', error);
      }
    );
  }

  initDeviceOrientation() {
    this.deviceOrientation.watchHeading().subscribe(
      (heading) => {
        this.heading = heading.trueHeading;
        this.socket.send({ type: 'heading', data: heading.trueHeading }).subscribe(
          (message) => {
            console.info(message);
          },
          (error) => {
            console.error('Error: Failed to send heading', error);
          },
          () => {
            console.info('Heading sent');
          }
        );
      },
      (error) => {
        console.error('Error: Failed to get current heading', error);
      }
    );
  }

  handleSlideWillChange(event) {
    this.swipedCount++;
    if (this.swipedCount > 1) {
      this.socket.send({ type: 'payment' }).subscribe(
        (message) => {
          console.info(message);
        },
        (error) => {
          console.error('Error: Failed to make payment', error);
        },
        () => {
          console.info('Payment made');
        }
      );
    }
  }

}
