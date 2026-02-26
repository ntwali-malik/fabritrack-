package com.example.fabritrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FabritrackApplication {

	public static void main(String[] args) {
		SpringApplication.run(FabritrackApplication.class, args);
	}

}
