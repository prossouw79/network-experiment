#!/bin/bash

host=$(hostname)
echo "Hostname is: " $host

WIFIADAPTER='wlan0'
if [[ $host = MeshVM ]]; then
    WIFIADAPTER='wlx000f0039a824' 
fi
echo 'Adapter:' $WIFIADAPTER

#adapted from https://www.reddit.com/r/darknetplan/comments/68s6jp/how_to_configure_batmanadv_on_the_raspberry_pi_3/

sudo apt install libnl-3-dev libnl-genl-3-dev git build-essential net-tools iperf3 fping htop bmon -y

sudo rm -R batctl
git clone https://git.open-mesh.org/batctl.git --depth 1
cd batctl
sudo make install -j 4

echo "Done installing depencies, activating BATMAN"

sleep 3

# Activate batman-adv
sudo modprobe batman-adv
# Disable and configure wlan0
sudo ip link set wlan0 down
sudo ifconfig wlan0 mtu 1532
sudo iwconfig wlan0 mode ad-hoc
sudo iwconfig wlan0 essid raspi-mesh
sudo iwconfig wlan0 ap any
sudo iwconfig wlan0 channel 8
sleep 1s
sudo ip link set wlan0 up
sleep 1s
sudo batctl if add wlan0
sleep 1s
sudo ifconfig bat0 up
sleep 3s



if [[ $host = MeshVM ]]; then
    sudo ifconfig bat0 192.168.1.1/16
fi

if [[ $host = pi-blue ]]; then
    sudo ifconfig bat0 192.168.1.11/16
fi

if [[ $host  = pi-white ]]; then
    sudo ifconfig bat0 192.168.1.12/16
fi

if [[ $host = pi-black ]]; then
    sudo ifconfig bat0 192.168.1.13/16
fi

ifconfig