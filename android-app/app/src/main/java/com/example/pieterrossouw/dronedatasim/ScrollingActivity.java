package com.example.pieterrossouw.dronedatasim;

import android.os.Build;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;
import com.google.gson.Gson;

import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Random;
import java.util.UUID;

public class ScrollingActivity extends AppCompatActivity {
    Gson JSON = new Gson();
    Random random = new Random();
    ArrayList<PositionUpdate> updateHistory = new ArrayList<PositionUpdate>();
    String myNodeID = UUID.randomUUID().toString();
    PositionUpdate currentPosition = new PositionUpdate(myNodeID, 0,0,0);

    String serverIP = "http://192.168.10.249:3000";

    private Socket mSocket;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_scrolling);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);


        final EditText ipInput = (EditText) findViewById(R.id.serverIP);
        Button setIP = (Button) findViewById(R.id.setIP);
        Button sendCoordinates = (Button) findViewById(R.id.sendCoordinates);
        final TextView outputLog = (TextView) findViewById(R.id.ouputLog);

        setIP.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                serverIP = "http://";
                serverIP += ipInput.getText();
                serverIP += ":3000";

                try {
                    mSocket = IO.socket(serverIP);
                    outputLog.append("\nSet server URI to " + serverIP);
                    outputLog.append("\nConnecting...");
                    mSocket.connect();

                    Message m = new Message("newNodeREQ", "" , myNodeID);

                    mSocket.emit("transmission", JSON.toJson(m));

                } catch (Exception e) {
                    outputLog.append(e.getMessage());
                }
            }
        });


        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                //Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
                       // .setAction("Action", null).show();
                sendRandomPosition(-5,5);
            }
        });
    }



    public void sendRandomPosition(double min, double max){

        double rX = min + random.nextDouble() * (max - min);
        double rY = min + random.nextDouble() * (max - min);
        double rZ = min + random.nextDouble() * (max - min);

        PositionUpdate newPosition = currentPosition;

        newPosition.X += rX;
        newPosition.Y += rY;
        newPosition.Z += rZ;

        updateHistory.add(newPosition);

        Message m = new Message("positionUpdate", JSON.toJson(currentPosition),myNodeID);

        mSocket.emit("transmission", JSON.toJson(m));
        currentPosition = newPosition;
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_scrolling, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}

class Message{
    public String type, message, from;

    public Message(String _type, String _message, String _from){
        type = _type;
        message = _message;
        from = _from;
    }
}

class PositionUpdate{
    public String NodeID;
    public double X, Y,Z,DistanceMoved,AverageSpeed;


    public PositionUpdate(String _NodeID, double _x,double _y,double _z){
        NodeID = _NodeID;
        X = _x;
        Y = _y;
        Z = _z;
        DistanceMoved = 0;
        AverageSpeed = 0;
    }
}
