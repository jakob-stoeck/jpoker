<?php
$url = "http://127.0.0.1:19382/REST";
$packet = array("type" => "PacketPing");
$postData = json_encode($packet);

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($ch, CURLOPT_POST, TRUE);

curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
$response = curl_exec($ch);

print_r($response);
if(curl_errno($ch))
  {
    print curl_error($ch);
  }
curl_close($ch);
?>
