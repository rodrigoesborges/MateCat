<?php

/**
 * Created by PhpStorm.
 * User: roberto
 * Date: 02/03/15
 * Time: 19.17
 */
class Engines_Results_MyMemory_CreateUserResponse extends Engines_Results_AbstractResponse {

    public $key;
    public $id;
    public $pass;

    public function __construct( $response ) {
        if ( !is_array( $response ) ) {
            throw new Exception( "Invalid Response", -1 );
        }

        $this->responseStatus = $response[ 'code' ];
        $this->key            = $response[ 'key' ];
        $this->id             = $response[ 'id' ];
        $this->pass           = $response[ 'pass' ];
    }

} 