const os = require("os");
const fs = require("fs");

var endOfLine = require("os").EOL;

let networkInterfaces = {};

networkInterfaces["pi-host"] = {
  IP: "1",
  MAC: "00:0f:00:39:a8:24",
  GATEWAY: true
};

networkInterfaces["TinyTower"] = {
  IP: "1",
  MAC: "00:0f:00:39:a8:24",
  NIC: "wlx000f0039a824",
  GATEWAY: true
};

networkInterfaces["pi-1"] = {
  IP: "10",
  MAC: "00:0f:00:39:a8:6d",
  GATEWAY: false
};

networkInterfaces["pi-2"] = {
  IP: "20",
  MAC: "00:0f:00:39:a9:0d",
  GATEWAY: false
};

networkInterfaces["pi-3"] = {
  IP: "30",
  MAC: "00:0f:00:39:a9:24",
  GATEWAY: false
};

let hostname = os.hostname();

const CIDR = "/24";
const IPRANGE = "10.0.0.";

if (networkInterfaces[hostname]) {
  console.log("Known hostname, creating setup script");

  let nodeIP = networkInterfaces[hostname].IP;

  let scriptContent = "#!/bin/bash" + endOfLine;

  scriptContent = addLine(
    scriptContent,
    `ADAPTERNAME=$(basename -a /sys/class/net/* | grep "^wlx000f")`
  );

  scriptContent = addLine(scriptContent, "sudo su -");
  scriptContent = addLine(scriptContent, "apt-get update");
  scriptContent = addLine(
    scriptContent,
    "apt-get install libnl-3-dev libnl-genl-3-dev vim screen git bmon htop net-tools build-essential"
  );

  scriptContent = addLine(scriptContent, "cd ~");
  scriptContent = addLine(
    scriptContent,
    "git clone https://git.open-mesh.org/batctl.git --depth 1"
  );
  scriptContent = addLine(scriptContent, "cd batctl");
  scriptContent = addLine(scriptContent, "sudo make install");
  scriptContent = addLine(scriptContent, "cd ..");

  fs.writeFile("installBATMAN.sh", scriptContent);

  scriptContent = "#!/bin/bash" + endOfLine;

  scriptContent = addLine(
    scriptContent,
    `ADAPTERNAME=$(basename -a /sys/class/net/* | grep "^wlx000f")`
  );

  scriptContent = addLine(scriptContent, "sudo modprobe batman-adv");
  scriptContent = addLine(scriptContent, `sudo ip link set $ADAPTERNAME down`);
  scriptContent = addLine(scriptContent, `sudo ifconfig $ADAPTERNAME mtu 1532`);
  scriptContent = addLine(
    scriptContent,
    `sudo iwconfig $ADAPTERNAME mode ad-hoc`
  );
  scriptContent = addLine(
    scriptContent,
    `sudo iwconfig $ADAPTERNAME essid raspi-mesh`
  );
  scriptContent = addLine(scriptContent, `sudo iwconfig $ADAPTERNAME ap any`);
  scriptContent = addLine(
    scriptContent,
    `sudo iwconfig $ADAPTERNAME channel 8`
  );
  scriptContent = addLine(scriptContent, `sleep 1s`);
  scriptContent = addLine(scriptContent, `sudo ip link set $ADAPTERNAME up`);
  scriptContent = addLine(scriptContent, `sleep 1s`);
  scriptContent = addLine(scriptContent, `sudo batctl if add $ADAPTERNAME`);
  scriptContent = addLine(scriptContent, `sleep 1s`);
  scriptContent = addLine(scriptContent, `sudo ifconfig bat0 up`);
  scriptContent = addLine(scriptContent, `sleep 5s`);
  scriptContent = addLine(
    scriptContent,
    `sudo ifconfig bat0 ${IPRANGE}${nodeIP}${CIDR}`
  );
  scriptContent = addLine(scriptContent, `sleep 5s`);
  scriptContent = addLine(
    scriptContent,
    networkInterfaces[hostname].GATEWAY
      ? `sudo batctl gw_mode server`
      : `sudo batctl gw_mode client`
  );

  fs.writeFile("startMesh.sh", scriptContent);

  console.log(`startMesh.sh written for ${hostname}`);
  console.log(`Next steps:`);
  console.log(`sudo mv startMesh.sh /root/startMesh.sh`);
  console.log(`sudo chmod 700 /root/startMesh.sh`);
  console.log(`sudo crontab -e`);
  console.log(`Choose any editor`);
  console.log(`Add '@reboot /root/startMesh.sh' at the bottom`);
  console.log(`Run 'sh /root/startMesh.sh'`);
}

function addLine(str, line) {
  str += line + endOfLine;
  return str;
}
