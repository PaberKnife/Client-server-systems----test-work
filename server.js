const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');

app.use(cors());

const connection = mysql.createConnection({
  host: 'd26893.mysql.zonevs.eu',
  user: 'd26893_busstops',
  password: '3w7PYquFJhver0!KdOfF',
  database: 'd26893_busstops'
});

connection.connect();

app.get('/nearest_stops', (req, res) => {
  const userLat = req.query.lat;
  const userLon = req.query.lon;

  // Поиск ближайшей остановки в базе данных:
  const query = "SELECT stop_id, stop_code, stop_name, stop_area, ST_Distance_Sphere(point(stop_lon, stop_lat), point(?, ?)) AS distance FROM golovan_stops ORDER BY distance LIMIT 1";
  var params = [userLon, userLat];
  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error });
    } else {
      res.status(200).json(results[0]);
    }
  });
});

app.get('/stop_areas', (req, res) => {
  const query = 'SELECT DISTINCT stop_area FROM golovan_stops ORDER BY stop_area ASC';
  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/stop_info', (req, res) => {
  const { region } = req.query;
  const query = 'SELECT DISTINCT stop_id, stop_code, stop_name FROM golovan_stops WHERE stop_area = ? ORDER BY stop_name ASC';
  connection.query(query, [region], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/route_short_names', (req, res) => {
  const { stop_id } = req.query;
  const query = `SELECT DISTINCT golovan_routes.route_short_name 
                 FROM golovan_stop_times 
                 JOIN golovan_trips ON golovan_stop_times.trip_id = golovan_trips.trip_id 
                 JOIN golovan_routes ON golovan_trips.route_id = golovan_routes.route_id
                 WHERE golovan_stop_times.stop_id = ?`;
  connection.query(query, [stop_id], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error });
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/stop_times', (req, res) => {
  const route_short_name = req.query.route_short_name;
  const stop_id = req.query.stop_id;
  const query = `SELECT departure_time, trip_long_name FROM golovan_stop_times 
                 JOIN golovan_trips ON golovan_stop_times.trip_id = golovan_trips.trip_id
                 JOIN golovan_routes ON golovan_trips.route_id = golovan_routes.route_id
                 WHERE route_short_name = '${route_short_name}' AND stop_id = '${stop_id}' 
                 ORDER BY departure_time`;
  connection.query(query, [route_short_name, stop_id], (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error });
    } else {
      res.status(200).json(results);
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
