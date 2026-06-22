package com.schoolmoney.service;

import com.schoolmoney.model.Fundraiser;
import com.schoolmoney.model.SchoolClass;
import com.schoolmoney.model.User;
import com.schoolmoney.repository.FundraiserRepository;
import com.schoolmoney.repository.SchoolClassRepository;
import com.schoolmoney.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final FundraiserRepository fundraiserRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final com.schoolmoney.repository.ChildRepository childRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getAllTreasurers() {
        List<String> treasurerIds = schoolClassRepository.findAll().stream()
                .map(SchoolClass::getTreasurerId)
                .distinct()
                .toList();
        return (List<User>) userRepository.findAllById(treasurerIds);
    }

    public User toggleUserBlock(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBlocked(!user.isBlocked());
        return userRepository.save(user);
    }

    public List<Fundraiser> getAllFundraisers() {
        return fundraiserRepository.findAll();
    }

    public Fundraiser toggleFundraiserBlock(String fundraiserId) {
        Fundraiser fundraiser = fundraiserRepository.findById(fundraiserId)
                .orElseThrow(() -> new RuntimeException("Fundraiser not found"));

        fundraiser.setBlocked(!fundraiser.isBlocked());
        return fundraiserRepository.save(fundraiser);
    }

    public List<SchoolClass> getAllClasses() {
        return schoolClassRepository.findAll();
    }

    public List<com.schoolmoney.model.Child> getAllChildren() {
        return childRepository.findAll();
    }
}